import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await client.auth.getUser();
  return user;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await requireUser(req);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const body = await req.json();
    const studentId = String(body?.studentId ?? '');
    if (!studentId) {
      return new Response(JSON.stringify({ success: false, error: 'studentId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Explicit authorization check (defense in depth on top of RLS).
    const { data: relation } = await client
      .from('instructor_students')
      .select('id, instructor:instructor_profiles!inner(user_id, status)')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle();

    const instructorMatch = relation?.instructor as { user_id: string; status: string } | undefined;
    const isAuthorizedInstructor = !!instructorMatch
      && instructorMatch.user_id === user.id
      && instructorMatch.status === 'approved';

    if (!isAuthorizedInstructor) {
      const { data: adminRole } = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!adminRole) {
        return new Response(JSON.stringify({ success: false, error: 'No autorizado para ver este alumno' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [profileRes, practiceRes, notesRes, questionsRes, earRes, enrollmentRes] = await Promise.all([
      client.from('profiles').select('full_name, primary_instrument').eq('user_id', studentId).maybeSingle(),
      client.from('practice_sessions').select('date, duration_minutes, notes, weekly_goal_minutes, instrument')
        .eq('user_id', studentId).gte('date', fourteenDaysAgo).order('date', { ascending: false }),
      client.from('lesson_notes').select('content, is_bookmark, created_at')
        .eq('user_id', studentId).order('is_bookmark', { ascending: false }).order('created_at', { ascending: false }).limit(5),
      client.from('teacher_questions').select('title, body, created_at')
        .eq('student_id', studentId).eq('status', 'open').order('created_at', { ascending: false }),
      client.from('ear_training_sessions').select('category, level, accuracy, created_at')
        .eq('user_id', studentId).order('created_at', { ascending: false }).limit(5),
      client.from('enrollments').select('course_id, created_at, courses(title)')
        .eq('user_id', studentId).eq('status', 'active').order('created_at', { ascending: false }).limit(1),
    ]);

    const practiceSessions = practiceRes.data || [];
    const totalMinutes = practiceSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const daysPracticed = practiceSessions.length;
    const weeklyGoal = practiceSessions[0]?.weekly_goal_minutes ?? 120;

    let courseProgress: { title: string; completedLessons: number; totalLessons: number } | null = null;
    const enrollment = enrollmentRes.data?.[0] as { course_id: string; courses: { title: string } | null } | undefined;
    if (enrollment?.course_id) {
      const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
        client.from('lessons').select('id, course_modules!inner(course_id)', { count: 'exact', head: true })
          .eq('course_modules.course_id', enrollment.course_id),
        client.from('lesson_progress').select('id', { count: 'exact', head: true })
          .eq('user_id', studentId).eq('course_id', enrollment.course_id).eq('completed', true),
      ]);
      courseProgress = {
        title: enrollment.courses?.title || 'Curso actual',
        completedLessons: completedLessons || 0,
        totalLessons: totalLessons || 0,
      };
    }

    const stats = {
      studentName: profileRes.data?.full_name || 'Alumno',
      instrument: profileRes.data?.primary_instrument || null,
      totalMinutes,
      daysPracticed,
      weeklyGoal,
      openQuestions: questionsRes.data?.length || 0,
      courseProgress,
    };

    const signalsForPrompt = {
      alumno: stats.studentName,
      instrumento: stats.instrument,
      practica_ultimos_14_dias: {
        minutos_totales: totalMinutes,
        dias_practicados: daysPracticed,
        meta_semanal_minutos: weeklyGoal,
        notas_del_alumno: practiceSessions.map((s) => s.notes).filter(Boolean),
      },
      apuntes_y_marcadores_recientes: (notesRes.data || []).map((n) => ({
        contenido: n.content,
        es_marcador: n.is_bookmark,
      })),
      preguntas_abiertas_al_maestro: (questionsRes.data || []).map((q) => ({
        titulo: q.title,
        cuerpo: q.body,
      })),
      entrenamiento_de_oido_reciente: (earRes.data || []).map((e) => ({
        categoria: e.category,
        nivel: e.level,
        precision_pct: e.accuracy,
      })),
      curso_actual: courseProgress,
    };

    const systemPrompt = `Eres un asistente que prepara un briefing pre-clase para un maestro de música, justo antes de dar su clase semanal de 1 hora con un alumno.

Recibes datos reales de la actividad del alumno en las últimas 2 semanas: práctica registrada, apuntes/marcadores, preguntas sin responder, resultados de entrenamiento auditivo y avance en su curso actual.

Reglas:
- Responde SIEMPRE en español, en Markdown, tono directo y práctico (el maestro lo lee en menos de 30 segundos antes de entrar a Zoom).
- Si no hay datos suficientes en alguna sección, dilo brevemente en vez de inventar información.
- No repitas los números crudos (ya se muestran aparte); interprétalos.

Estructura de salida:

## Resumen rápido
Un párrafo de 2-3 líneas con el estado general del alumno esta semana.

## Fortalezas de la semana
2-3 puntos concretos.

## Puntos a reforzar
2-3 puntos concretos, basados en las notas del alumno, baja precisión en oído, o falta de práctica.

## Sugerencia de enfoque para tu clase de hoy (60 min)
Una sugerencia de estructura o prioridad para la hora de clase.

## Dudas abiertas del alumno
Lista las preguntas sin responder que deberías resolver hoy. Si no hay, dilo.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Datos del alumno:\n\n${JSON.stringify(signalsForPrompt, null, 2)}` },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Demasiadas solicitudes, intenta en un momento.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Sin créditos de IA disponibles.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return new Response(JSON.stringify({ success: true, briefing: content, stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in student-briefing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
