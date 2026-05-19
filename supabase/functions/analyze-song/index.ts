import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VideoMetadata {
  title: string;
  author: string;
}

async function fetchYouTubeMetadata(youtubeUrl: string): Promise<VideoMetadata | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title ?? '',
      author: data.author_name ?? '',
    };
  } catch (e) {
    console.warn('oEmbed fetch failed', e);
    return null;
  }
}

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

    // Check for a saved user correction for this video first
    const authHeader = req.headers.get('Authorization');
    if (authHeader && videoId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const { data: correction } = await userClient
            .from('song_corrections')
            .select('corrected_analysis')
            .eq('user_id', user.id)
            .eq('video_id', videoId)
            .maybeSingle();
          if (correction?.corrected_analysis) {
            console.log('Returning saved user correction for video', videoId);
            return new Response(JSON.stringify({
              success: true,
              analysis: correction.corrected_analysis,
              fromCorrection: true,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.warn('Correction lookup failed', e);
      }
    }

    // Step 1: Get reliable song identification via YouTube oEmbed
    const metadata = await fetchYouTubeMetadata(youtubeUrl);
    console.log('YouTube metadata:', metadata);

    const songContext = metadata
      ? `Título oficial del video de YouTube: "${metadata.title}"\nCanal/Artista: "${metadata.author}"\nURL: ${youtubeUrl}\nVideo ID: ${videoId}`
      : `URL: ${youtubeUrl}\nVideo ID: ${videoId}\n(No se pudo obtener metadata del video)`;

    const systemPrompt = `Eres un transcriptor musical profesional de élite con oído absoluto, equivalente a los mejores arreglistas de Berklee y Hal Leonard. Tu trabajo es entregar la transcripción armónica EXACTA y verificada de canciones populares.

PROCESO OBLIGATORIO (sigue cada paso internamente):
1. IDENTIFICA con certeza la canción a partir del título y el artista del video. Si el título incluye "cover", "tutorial", "karaoke", "live", "acoustic" o similar, identifica la canción ORIGINAL.
2. RECUERDA la grabación oficial de estudio (o la versión más reconocida) de esa canción.
3. DETERMINA la tonalidad real verificando: nota tónica del bajo en la cadencia final, calidad mayor/menor del primer y último acorde, y armadura.
4. TRANSCRIBE los acordes EXACTOS sección por sección, en el orden real, respetando inversiones y séptimas cuando son parte definitoria (Cmaj7, G/B, Am7, D7sus4, etc.).
5. VERIFICA tu transcripción mentalmente cantando la melodía sobre los acordes y confirmando que encajan.
6. Si tienes CUALQUIER duda sobre la tonalidad o un acorde, prefiere la versión más documentada (Ultimate Guitar verificado, Hooktheory, transcripciones oficiales) en vez de inventar.

REGLAS CRÍTICAS DE PRECISIÓN:
- NUNCA inventes acordes. Si no recuerdas con certeza una sección, omite esa sección antes que mentir.
- NO uses progresiones "genéricas" tipo I-V-vi-IV por defecto. Usa la progresión real de la canción.
- Notación estándar internacional: C, C#, Db, D, Eb, E, F, F#, Gb, G, Ab, A, Bb, B. Menores con "m" minúscula (Am, Dm). Séptimas: maj7, m7, 7. Inversiones con slash: G/B, C/E.
- La tonalidad debe estar en español: "Do Mayor", "La menor", "Sol Mayor", etc.
- Los números romanos en "progression.numerals" deben ser RELATIVOS a la tonalidad declarada en "key" (mayúsculas = mayor, minúsculas = menor, ej: I - V - vi - IV en Do Mayor = C - G - Am - F).
- La suma de "bars" debería ser coherente con una canción real (no inventes 50 compases).
- "structure" debe reflejar la forma real: Intro, Verso, Pre-Coro, Coro, Puente, Solo, Outro según corresponda.
- "tempo" debe ser un BPM realista verificado (ej: "120 BPM"), no aproximaciones absurdas.

RESPONDE ÚNICAMENTE en JSON VÁLIDO con esta estructura EXACTA (sin texto antes ni después, sin markdown, sin \`\`\`):

{
  "songTitle": "Título oficial de la canción (no el del video de YouTube)",
  "artist": "Artista original",
  "key": "Tonalidad en español",
  "tempo": "BPM",
  "timeSignature": "4/4",
  "chords": ["acordes únicos usados"],
  "structure": [
    {"section": "Intro", "chords": ["C", "G", "Am", "F"], "bars": 4}
  ],
  "progression": {
    "name": "Nombre conocido de la progresión si aplica",
    "numerals": "I - V - vi - IV",
    "description": "Por qué funciona y dónde se usa en la canción"
  },
  "difficulty": "Fácil|Intermedio|Avanzado",
  "tips": ["3-5 consejos específicos para tocar ESTA canción"],
  "similarSongs": ["3 canciones reales con la misma progresión"]
}`;

    const userPrompt = `Analiza esta canción y devuelve los acordes EXACTOS de la grabación original.

${songContext}

Identifica la canción original, recuerda la transcripción verificada y entrega el JSON con la armonía exacta. Verifica internamente antes de responder.`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
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

    // If oEmbed gave us reliable title/artist and the model returned something empty, fall back
    if (metadata) {
      if (!analysisData.songTitle) analysisData.songTitle = metadata.title;
      if (!analysisData.artist) analysisData.artist = metadata.author;
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
