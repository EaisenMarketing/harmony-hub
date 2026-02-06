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
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { chordName, instrument } = await req.json();

    if (!chordName || !instrument) {
      throw new Error('Chord name and instrument are required');
    }

    const systemPrompt = instrument === 'piano' 
      ? `Eres un experto en teoría musical y PIANO. Cuando el usuario te pida un acorde, debes responder SOLO en formato JSON con la siguiente estructura:
{
  "chordName": "nombre del acorde",
  "notes": ["lista", "de", "notas"],
  "fingers": "descripción de qué dedos usar en el TECLADO (1=pulgar, 2=índice, 3=medio, 4=anular, 5=meñique)",
  "keyPositions": "descripción de las TECLAS a presionar de izquierda a derecha",
  "tips": "consejos específicos para PIANO sobre posición de manos, relajación de muñeca, transiciones entre TECLAS, etc. NUNCA menciones cuerdas, trastes o guitarra.",
  "variations": ["variaciones comunes del acorde en piano"]
}

IMPORTANTE: 
- Todos los consejos deben ser ESPECÍFICOS para PIANO y TECLADO
- NUNCA uses términos de guitarra como "cuerda", "traste", "rasgueo", "cejilla"
- Usa términos de piano como "tecla", "octava", "digitación", "posición de mano"
- Los consejos deben hablar sobre presión de teclas, independencia de dedos, postura de mano en el teclado

No incluyas texto adicional fuera del JSON.`
      : `Eres un experto en teoría musical y GUITARRA. Cuando el usuario te pida un acorde, debes responder SOLO en formato JSON con la siguiente estructura:
{
  "chordName": "nombre del acorde",
  "notes": ["lista", "de", "notas que suenan"],
  "frets": [posición de cada cuerda desde la 6ta (E grave) a la 1ra (e agudo), usar -1 para cuerdas que no se tocan, 0 para cuerdas al aire],
  "fingers": [dedo a usar en cada cuerda, 0=no tocar/al aire, 1=índice, 2=medio, 3=anular, 4=meñique],
  "barreInfo": "información sobre cejilla si aplica, o null",
  "tips": "consejos específicos para GUITARRA sobre posición de dedos, evitar mutear cuerdas al aire, ángulo de los dedos en los trastes, presión adecuada, etc. NUNCA menciones teclas o piano.",
  "strumPattern": "patrón de rasgueo sugerido"
}

IMPORTANTE:
- Todos los consejos deben ser ESPECÍFICOS para GUITARRA
- NUNCA uses términos de piano como "tecla", "teclado", "octava"
- Usa términos de guitarra como "cuerda", "traste", "mástil", "cejilla", "rasgueo", "punteo"
- Los consejos deben hablar sobre posición de dedos en trastes, cuerdas al aire, cómo no mutear cuerdas, presión en el mástil
- Asegúrate de que los dedos no muteen cuerdas que deben sonar al aire

No incluyas texto adicional fuera del JSON.`;

    console.log(`Generating ${instrument} chord for: ${chordName}`);

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
          { role: 'user', content: `Dame el acorde: ${chordName}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Límite de solicitudes excedido. Intenta de nuevo en unos segundos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Se requiere agregar créditos para continuar usando esta función.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', content);

    // Parse the JSON response
    let chordData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        chordData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      chordData = { rawResponse: content };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      chord: chordData,
      instrument 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating chord:', error);
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
