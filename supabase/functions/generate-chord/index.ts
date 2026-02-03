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

    const { chordName, instrument } = await req.json();

    if (!chordName || !instrument) {
      throw new Error('Chord name and instrument are required');
    }

    const systemPrompt = instrument === 'piano' 
      ? `Eres un experto en teoría musical y piano. Cuando el usuario te pida un acorde, debes responder SOLO en formato JSON con la siguiente estructura:
{
  "chordName": "nombre del acorde",
  "notes": ["lista", "de", "notas"],
  "fingers": "descripción de qué dedos usar (1=pulgar, 2=índice, 3=medio, 4=anular, 5=meñique)",
  "keyPositions": "descripción de las teclas a presionar de izquierda a derecha",
  "tips": "consejos adicionales para tocar el acorde",
  "variations": ["variaciones comunes del acorde"]
}
No incluyas texto adicional fuera del JSON.`
      : `Eres un experto en teoría musical y guitarra. Cuando el usuario te pida un acorde, debes responder SOLO en formato JSON con la siguiente estructura:
{
  "chordName": "nombre del acorde",
  "notes": ["lista", "de", "notas"],
  "frets": [posición de cada cuerda desde la 6ta a la 1ra, usar -1 para cuerdas que no se tocan],
  "fingers": [dedo a usar en cada cuerda, 0=no tocar, 1=índice, 2=medio, 3=anular, 4=meñique],
  "barreInfo": "información sobre cejilla si aplica, o null",
  "tips": "consejos adicionales para tocar el acorde",
  "strumPattern": "patrón de rasgueo sugerido"
}
No incluyas texto adicional fuera del JSON.`;

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
      const errorText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

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
