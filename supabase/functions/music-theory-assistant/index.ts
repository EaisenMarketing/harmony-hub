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
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body = await req.json();
    const rawQuestion = typeof body?.question === 'string' ? body.question : '';
    const question = rawQuestion.slice(0, 1000);
    if (!question.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawHistory = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];
    const safeHistory = rawHistory.slice(-20).map((msg: { role?: unknown; content?: unknown }) => ({
      role: String(msg?.role ?? 'user').slice(0, 20),
      content: String(msg?.content ?? '').slice(0, 2000),
    }));

    const systemPrompt = `Eres un experto profesor de teoría musical con décadas de experiencia. Tu especialidad incluye:

- Teoría musical clásica y moderna
- Armonía moderna y jazz
- Modos griegos (Jónico, Dórico, Frigio, Lidio, Mixolidio, Eólico, Locrio) y sus aplicaciones
- Progresiones de acordes y análisis armónico
- Escalas y su relación con acordes
- Contrapunto y conducción de voces
- Ritmo, métrica y síncopa
- Forma musical y estructura
- Improvisación y composición

Responde de manera clara, pedagógica y con ejemplos prácticos cuando sea posible. Si el estudiante hace una pregunta que no está relacionada con música, amablemente redirígelo al tema musical.

Usa formato markdown para estructurar tus respuestas:
- Usa **negritas** para términos importantes
- Usa listas para enumerar conceptos
- Usa ejemplos concretos cuando sea posible`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...safeHistory,
      { role: 'user', content: question }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      answer: content 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in music theory assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
