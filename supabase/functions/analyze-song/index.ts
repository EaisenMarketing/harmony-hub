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

    const { youtubeUrl, videoId } = await req.json();

    if (!youtubeUrl) {
      throw new Error('YouTube URL is required');
    }

    console.log(`Analyzing song from YouTube: ${youtubeUrl}`);

    const systemPrompt = `Eres un músico profesional con oído absoluto y décadas de experiencia en análisis musical. Tu habilidad para identificar acordes, progresiones y estructuras es legendaria. Cuando te dan un enlace de YouTube de una canción, debes analizarla completamente.

IMPORTANTE: Responde ÚNICAMENTE en formato JSON válido con esta estructura exacta:

{
  "songTitle": "Título de la canción",
  "artist": "Nombre del artista",
  "key": "Tonalidad (ej: Do Mayor, La menor)",
  "tempo": "BPM aproximado (ej: 120 BPM)",
  "timeSignature": "Compás (ej: 4/4)",
  "chords": ["lista", "de", "todos", "los", "acordes", "usados"],
  "structure": [
    {"section": "Intro", "chords": ["Am", "F", "C", "G"], "bars": 4},
    {"section": "Verso 1", "chords": ["Am", "F", "C", "G"], "bars": 8},
    {"section": "Coro", "chords": ["F", "G", "Am", "C"], "bars": 8}
  ],
  "progression": {
    "name": "Nombre de la progresión (ej: I-V-vi-IV, Progresión del Pop, etc.)",
    "numerals": "I - V - vi - IV",
    "description": "Descripción de por qué esta progresión es efectiva y cómo se usa en la música"
  },
  "difficulty": "Fácil/Intermedio/Avanzado",
  "tips": [
    "Consejo específico 1 para tocar esta canción",
    "Consejo específico 2",
    "Consejo sobre la técnica requerida"
  ],
  "similarSongs": ["Canción 1 con progresión similar", "Canción 2", "Canción 3"]
}

REGLAS:
1. Identifica la canción por el enlace de YouTube proporcionado
2. Si no puedes identificar la canción exacta, haz tu mejor aproximación basada en el ID del video
3. Sé preciso con los acordes - usa notación estándar (Am, Dm7, G7, Cmaj7, etc.)
4. La estructura debe reflejar la canción real con sus secciones
5. Identifica la progresión armónica principal y nómbrala si es una progresión conocida
6. Los consejos deben ser específicos y útiles para un músico que quiere aprender la canción
7. No incluyas texto fuera del JSON`;

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
          { role: 'user', content: `Analiza esta canción de YouTube: ${youtubeUrl}\n\nVideo ID: ${videoId}\n\nProporciona un análisis completo de los acordes, estructura y progresión armónica.` }
        ],
        temperature: 0.4,
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
    let analysisData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error('Error parsing AI response');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysisData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error analyzing song:', error);
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
