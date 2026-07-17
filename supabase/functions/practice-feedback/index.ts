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

// Accepted audio containers that Gemini can ingest via input_audio.
const AUDIO_FORMATS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await requireUser(req);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const body = await req.json();
    const audioBase64 = String(body?.audioBase64 ?? '');
    const mimeType = String(body?.mimeType ?? 'audio/webm').toLowerCase();
    const instrument = String(body?.instrument ?? '').slice(0, 60);
    const level = String(body?.level ?? 'intermedio').slice(0, 40);
    const piece = String(body?.piece ?? '').slice(0, 200);
    const goals = String(body?.goals ?? '').slice(0, 500);

    if (!audioBase64 || audioBase64.length < 200) {
      return new Response(JSON.stringify({ success: false, error: 'Audio vacío o inválido.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Base64 length ~= 4/3 * bytes; cap at ~15 MB of source audio.
    if (audioBase64.length > 20 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, error: 'Audio demasiado grande (máx ~15 MB).' }), {
        status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const format = AUDIO_FORMATS[mimeType.split(';')[0]] ?? 'webm';

    const systemPrompt = `Eres un profesor de música experto y empático. Vas a escuchar la grabación de práctica de un estudiante y darle feedback específico, técnico y motivador.

Analiza:
- Afinación / entonación
- Tempo, groove y estabilidad rítmica
- Dinámica y expresión
- Técnica específica del instrumento
- Errores concretos (nota, compás aproximado si es posible)
- Fortalezas del estudiante

Responde SIEMPRE en español y en formato Markdown con esta estructura:

## Impresión general
Un párrafo corto y honesto pero motivador.

## Lo que estás haciendo bien
Lista de fortalezas concretas.

## Áreas a mejorar
Lista con puntos específicos (menciona el momento aproximado si lo detectas: "hacia el segundo 12...", "en la segunda repetición...").

## Ejercicios recomendados
3-5 ejercicios concretos para trabajar esta semana los puntos débiles.

## Próximo paso
Una frase clara con la prioridad número 1 para su siguiente sesión.`;

    const userText = `Instrumento: ${instrument || 'no especificado'}
Nivel: ${level}
Pieza/ejercicio: ${piece || 'no especificado'}
Objetivos personales: ${goals || 'no especificado'}

Escucha mi grabación y dame feedback específico.`;

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
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              { type: 'input_audio', input_audio: { data: audioBase64, format } },
            ],
          },
        ],
        temperature: 0.6,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Demasiadas solicitudes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Sin créditos de IA.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway ${response.status}: ${txt}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Sin respuesta de la IA');

    return new Response(JSON.stringify({ success: true, feedback: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('practice-feedback error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
