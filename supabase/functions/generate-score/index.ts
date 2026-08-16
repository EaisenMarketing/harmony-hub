import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const INSTRUMENTS = ['guitar', 'electric_guitar', 'bass', 'piano', 'trumpet', 'drums'];
const DRUM_PIECES = ['kick', 'snare', 'hihat', 'openhat', 'crash', 'ride', 'tom1', 'tom2', 'floor'];
const DURATIONS = ['w', 'h', 'q', '8', '16'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const CLEF_HINT: Record<string, string> = {
  guitar: 'Clave de sol. Rango cómodo E2–E5 (midi 40–76).',
  electric_guitar: 'Clave de sol. Rango cómodo E2–A5 (midi 40–81).',
  bass: 'Clave de fa. Rango E1–C4 (midi 28–60). Escribe líneas de bajo con groove.',
  piano: 'Clave de sol. Rango C2–C6 (midi 36–84). Puedes usar acordes de 2 a 4 notas.',
  trumpet: 'Clave de sol. Rango G3–A5 (midi 55–82). Frases respirables, no más de 4 compases seguidos.',
  drums: 'Notación percusiva: usa el campo "drums" con las piezas, nunca "keys".',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    let prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1200) : '';
    const youtubeUrl = typeof body.youtubeUrl === 'string' ? body.youtubeUrl.trim().slice(0, 300) : '';
    const instrument = INSTRUMENTS.includes(body.instrument) ? body.instrument : 'guitar';
    const level = typeof body.level === 'string' ? body.level.slice(0, 40) : 'principiante';
    const measures = Math.min(16, Math.max(2, Number(body.measures) || 8));
    const keySig = typeof body.key === 'string' ? body.key.slice(0, 4) : 'C';
    const timeSig = typeof body.time === 'string' ? body.time.slice(0, 5) : '4/4';
    const tempo = Math.min(240, Math.max(40, Number(body.tempo) || 90));

    // --------- YouTube: obtener título/autor del video para arreglar la canción
    let ytTitle = '';
    if (youtubeUrl) {
      const idMatch = youtubeUrl.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
      if (!idMatch) return json({ error: 'El link de YouTube no es válido.' }, 400);
      const videoId = idMatch[1];
      try {
        const oe = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        );
        if (oe.ok) {
          const meta = await oe.json();
          ytTitle = `${meta?.title ?? ''} — ${meta?.author_name ?? ''}`.trim();
        }
      } catch (e) {
        console.error('oembed error', e);
      }
      if (!ytTitle) return json({ error: 'No se pudo leer el video de YouTube. Verifica el link.' }, 400);
      prompt = `Transcribe y arregla la canción del video de YouTube "${ytTitle}" para ${instrument}. ` +
        `Usa la progresión y melodía principal reconocibles del tema (estribillo o riff principal). ` +
        (prompt ? `Indicaciones extra del alumno: ${prompt}` : '');
    }

    if (!prompt) return json({ error: 'Describe qué partitura quieres generar.' }, 400);


    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'AI no configurada' }, 500);

    const system = `Eres un arreglista y profesor de música de Acorde Live. Generas partituras en un JSON estricto.

Formato de salida (SOLO JSON, sin markdown):
{
  "title": "string",
  "description": "consejo breve de interpretación para el alumno",
  "measures": [
    { "notes": [ { "keys": ["c/4"], "duration": "q", "dotted": false, "rest": false, "chord": "C" } ] }
  ]
}

Reglas estrictas:
- "duration" solo puede ser: ${DURATIONS.join(', ')} (w=redonda, h=blanca, q=negra, 8=corchea, 16=semicorchea).
- Las notas usan formato VexFlow minúsculas con octava: "c/4", "f#/3", "bb/4".
- Cada compás debe sumar exactamente los tiempos de ${timeSig}.
- Genera exactamente ${measures} compases.
- Usa silencios con "rest": true y "keys": ["b/4"].
- Escribe el nombre del acorde en "chord" solo en la primera nota de cada cambio armónico.
- Tonalidad ${keySig}, tempo ${tempo} BPM, nivel del alumno: ${level}.
- Instrumento: ${instrument}. ${CLEF_HINT[instrument]}
- Para batería cada nota lleva "drums": ["kick"] o ["hihat","snare"] y "keys": [].`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (res.status === 429) return json({ error: 'Demasiadas solicitudes, intenta en un momento.' }, 429);
    if (res.status === 402) return json({ error: 'Créditos de IA agotados.' }, 402);
    if (!res.ok) {
      const t = await res.text();
      console.error('gateway error', res.status, t);
      return json({ error: 'La IA no pudo generar la partitura.' }, 500);
    }

    const payload = await res.json();
    const raw = payload?.choices?.[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = String(raw).match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    // --------- sanitizar
    const isDrums = instrument === 'drums';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawMeasures = Array.isArray((parsed as any).measures) ? (parsed as any).measures : [];
    const cleanMeasures = rawMeasures.slice(0, 16).map((m: Record<string, unknown>) => {
      const notes = Array.isArray(m?.notes) ? m.notes : [];
      return {
        notes: notes.slice(0, 32).map((n: Record<string, unknown>) => {
          const duration = DURATIONS.includes(String(n?.duration)) ? String(n.duration) : 'q';
          const rest = !!n?.rest;
          const drums = isDrums && Array.isArray(n?.drums)
            ? (n.drums as string[]).filter((d) => DRUM_PIECES.includes(d)).slice(0, 4)
            : undefined;
          const keys = Array.isArray(n?.keys)
            ? (n.keys as string[])
              .filter((k) => typeof k === 'string' && /^[a-gA-G][#b]?\/-?\d$/.test(k))
              .map((k) => k.toLowerCase())
              .slice(0, 6)
            : [];
          return {
            keys: rest ? ['b/4'] : (isDrums ? [] : (keys.length ? keys : ['c/4'])),
            duration,
            dotted: !!n?.dotted,
            rest,
            ...(drums?.length ? { drums } : {}),
            ...(typeof n?.chord === 'string' && n.chord ? { chord: String(n.chord).slice(0, 12) } : {}),
          };
        }),
      };
    }).filter((m: { notes: unknown[] }) => m.notes.length);

    if (!cleanMeasures.length) return json({ error: 'La IA no devolvió compases válidos.' }, 502);

    const doc = {
      title: typeof parsed.title === 'string' && parsed.title ? String(parsed.title).slice(0, 120) : prompt.slice(0, 60),
      instrument,
      key_signature: keySig,
      time_signature: timeSig,
      tempo,
      level,
      description: typeof parsed.description === 'string' ? String(parsed.description).slice(0, 600) : null,
      content: { measures: cleanMeasures },
    };

    return json({ doc, notes: doc.description });
  } catch (e) {
    console.error('generate-score error', e);
    return json({ error: 'Error inesperado generando la partitura.' }, 500);
  }
});
