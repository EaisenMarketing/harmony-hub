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
    const instrument = String(body?.instrument ?? '').slice(0, 40);
    const level = String(body?.level ?? 'principiante').slice(0, 40);
    const minutesPerDay = Math.max(5, Math.min(240, Number(body?.minutesPerDay) || 30));
    const daysPerWeek = Math.max(1, Math.min(7, Number(body?.daysPerWeek) || 4));
    const goals = String(body?.goals ?? '').slice(0, 800);
    const styles = String(body?.styles ?? '').slice(0, 200);
    const weakPoints = String(body?.weakPoints ?? '').slice(0, 500);

    if (!instrument.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'instrument is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `Eres un coach de práctica musical experto y motivador. Diseñas rutinas de práctica personalizadas, realistas y progresivas para músicos que aprenden un instrumento. 

Principios que sigues:
- Distribuir el tiempo en bloques: calentamiento, técnica, teoría/oído, repertorio y creatividad/improvisación.
- Adaptar dificultad al nivel del alumno.
- Priorizar los puntos débiles indicados.
- Incluir ejercicios concretos, escalas, patrones o canciones ejemplo.
- Ser motivador y claro.

Responde SIEMPRE en español y en formato Markdown, con esta estructura:

## Resumen del plan
Un párrafo corto explicando el enfoque de la semana.

## Rutina diaria (X minutos)
Tabla con | Bloque | Minutos | Qué hacer |

## Plan semanal
Lista día por día (solo los días de práctica), con el foco principal de cada día.

## Ejercicios recomendados
Lista de 4-6 ejercicios concretos con instrucciones breves.

## Consejos para esta semana
3-5 tips personalizados y motivadores.

## Cómo medir tu progreso
Checklist corto para autoevaluarse al final de la semana.`;

    const userPrompt = `Diseña mi plan de práctica personalizado.

- Instrumento: ${instrument}
- Nivel: ${level}
- Tiempo disponible por día: ${minutesPerDay} minutos
- Días por semana: ${daysPerWeek}
- Estilos que me interesan: ${styles || 'no especificado'}
- Objetivos: ${goals || 'mejorar de forma general'}
- Puntos débiles / lo que me cuesta: ${weakPoints || 'no especificado'}`;

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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
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

    return new Response(JSON.stringify({ success: true, plan: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in practice-coach:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
