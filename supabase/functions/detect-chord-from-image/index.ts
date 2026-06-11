import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { imageBase64, imageUrl, instrument } = await req.json();

    if (!instrument || !['piano', 'guitar'].includes(instrument)) {
      return new Response(JSON.stringify({ error: 'instrument must be piano or guitar' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!imageBase64 && !imageUrl) {
      return new Response(JSON.stringify({ error: 'imageBase64 or imageUrl is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imagePayloadUrl = imageBase64
      ? (imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`)
      : imageUrl;

    const systemPrompt = instrument === 'piano'
      ? `Eres un experto en PIANO y reconocimiento visual. Analiza la foto de una mano en un teclado de piano e identifica qué acorde está tocando.

Responde SOLO en JSON con esta estructura:
{
  "detectedChord": "nombre del acorde detectado (ej: Do mayor, Am7) o null si no detectas",
  "confidence": número de 0 a 1,
  "notes": ["lista de notas que se están tocando"],
  "fingers": "qué dedos están en qué teclas (1=pulgar... 5=meñique)",
  "handPosture": "evaluación breve de la postura de la mano",
  "suggestions": "sugerencias para mejorar la posición o si la mano está mal colocada. Si la imagen no muestra un piano o una mano, di que no puedes identificar acorde."
}

NUNCA inventes un acorde si no puedes identificarlo. Si la imagen no es clara, pon detectedChord en null y explica en suggestions.`
      : `Eres un experto en GUITARRA y reconocimiento visual. Analiza la foto de una mano sobre el mástil de una guitarra e identifica qué acorde está formando.

Responde SOLO en JSON con esta estructura:
{
  "detectedChord": "nombre del acorde detectado (ej: G, Am, F#m7) o null si no detectas",
  "confidence": número de 0 a 1,
  "notes": ["notas que sonarían"],
  "fingers": "qué dedos en qué traste/cuerda (1=índice, 2=medio, 3=anular, 4=meñique)",
  "handPosture": "evaluación breve de la postura: ángulo de dedos, presión, muñeca",
  "suggestions": "sugerencias para mejorar la posición, evitar mutear cuerdas, o si la mano está mal colocada. Si la imagen no muestra una guitarra o una mano, di que no puedes identificar acorde."
}

NUNCA inventes un acorde si no puedes identificarlo. Si la imagen no es clara, pon detectedChord en null y explica en suggestions.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Identifica el acorde de ${instrument === 'piano' ? 'piano' : 'guitarra'} en esta foto.` },
              { type: 'image_url', image_url: { url: imagePayloadUrl } },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Demasiadas peticiones, intenta en un momento.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Sin créditos de IA. Contacta al admin.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error ${response.status}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    // Try to parse JSON from content (model may wrap in code fences)
    let parsed: Record<string, unknown> = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error('Failed to parse AI JSON', e, content);
      parsed = { detectedChord: null, suggestions: content || 'No se pudo interpretar la respuesta.' };
    }

    return new Response(JSON.stringify({ success: true, result: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('detect-chord-from-image error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
