import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { question, conversationHistory = [] } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

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
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
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
