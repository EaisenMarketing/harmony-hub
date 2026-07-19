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
    const category = String(body?.category ?? 'intervals'); // intervals | chords | rhythms | mixed
    const requestedLevel = String(body?.level ?? 'principiante').slice(0, 40);
    const instrument = String(body?.instrument ?? 'general').slice(0, 40);
    const count = Math.max(3, Math.min(10, Number(body?.count) || 6));
    const recentAccuracy = Number(body?.recentAccuracy); // 0-100 optional
    const focus = String(body?.focus ?? '').slice(0, 300);
    // Recent history: [{ accuracy, level, category, perType?: { interval, chord, rhythm } }]
    const history: Array<{ accuracy?: number; level?: string; category?: string; perType?: Record<string, number> }> =
      Array.isArray(body?.history) ? body.history.slice(0, 10) : [];

    // ---------- Adaptive difficulty algorithm ----------
    const LEVELS = ['principiante', 'intermedio', 'avanzado'] as const;
    type Lvl = typeof LEVELS[number];
    const clampLvl = (i: number): Lvl => LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i))];
    const idxOf = (l: string): number => Math.max(0, LEVELS.indexOf((l as Lvl)) );

    // Weight recent sessions more (exponential decay)
    let weightedAcc = 0, weightSum = 0;
    history.forEach((h, i) => {
      const acc = Number(h?.accuracy);
      if (!Number.isFinite(acc)) return;
      const w = Math.pow(0.7, i); // most recent first
      weightedAcc += acc * w;
      weightSum += w;
    });
    const smoothedAcc = weightSum > 0 ? weightedAcc / weightSum
      : (Number.isFinite(recentAccuracy) ? recentAccuracy : NaN);

    // Consecutive high/low streaks trigger jumps
    const highStreak = history.slice(0, 3).every(h => Number(h?.accuracy) >= 85) && history.length >= 2;
    const lowStreak  = history.slice(0, 3).every(h => Number(h?.accuracy) <= 45) && history.length >= 2;

    let level: Lvl = (LEVELS.includes(requestedLevel as Lvl) ? requestedLevel : 'principiante') as Lvl;
    let adjustmentNote = '';
    if (Number.isFinite(smoothedAcc)) {
      let delta = 0;
      if (smoothedAcc >= 90 || highStreak) delta = +1;
      else if (smoothedAcc >= 75) delta = 0;
      else if (smoothedAcc >= 55) delta = 0;
      else if (smoothedAcc >= 40) delta = -1;
      else delta = lowStreak ? -1 : -1;
      const newLvl = clampLvl(idxOf(level) + delta);
      if (newLvl !== level) {
        adjustmentNote = `Ajuste automático: nivel cambiado de "${level}" a "${newLvl}" por precisión reciente ${Math.round(smoothedAcc)}%.`;
        level = newLvl;
      }
    }

    // Detect weakest sub-type across history for weighting
    const typeAcc: Record<string, { sum: number; n: number }> = {};
    history.forEach(h => {
      const pt = h?.perType || {};
      Object.entries(pt).forEach(([k, v]) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        if (!typeAcc[k]) typeAcc[k] = { sum: 0, n: 0 };
        typeAcc[k].sum += n; typeAcc[k].n += 1;
      });
    });
    const weakTypes = Object.entries(typeAcc)
      .map(([k, v]) => ({ k, avg: v.sum / v.n }))
      .filter(x => x.avg < 70)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 2)
      .map(x => x.k);

    // Difficulty knobs given to the model
    const difficultyGuide = level === 'principiante'
      ? 'Usa intervalos simples (2M, 3M, 4J, 5J, 8J), acordes tríadas mayores/menores, ritmos de 8 pulsos en 4/4 sencillos.'
      : level === 'intermedio'
      ? 'Incluye intervalos como 3m, 6M, 7m, acordes con séptima (maj7, min7, dom7), y ritmos de 16 pulsos con síncopas moderadas.'
      : 'Usa intervalos cromáticos (2m, tritono, 7M), acordes dim/aug y extensiones, ritmos de 16 pulsos con síncopas y silencios complejos.';

    const systemPrompt = `Eres un experto en entrenamiento auditivo musical. Diseñas ejercicios de ear training progresivos y adaptados al nivel del estudiante.

Devuelve SIEMPRE un JSON válido (sin markdown, sin \`\`\`json) con este esquema exacto:
{
  "title": "string",
  "description": "string breve",
  "exercises": [
    {
      "id": "e1",
      "type": "interval" | "chord" | "rhythm",
      "prompt": "instrucción breve para el alumno",
      "hint": "pista opcional",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "answerIndex": 0,
      "explanation": "por qué esa es la respuesta",
      "playback": {
        "kind": "interval" | "chord" | "rhythm",
        "root": "C4",
        "notes": ["C4","E4"],
        "chordType": "maj" | "min" | "dim" | "aug" | "maj7" | "min7" | "dom7",
        "pattern": [1,0,1,1,0,1,0,1],
        "bpm": 90
      }
    }
  ],
  "tipsForImprovement": ["tip1","tip2","tip3"]
}

Reglas del campo "playback":
- Si type = "interval": kind="interval", root nota inicial (ej "C4"), notes = [root, segundaNota] (ej ["C4","G4"]).
- Si type = "chord": kind="chord", root nota fundamental, chordType uno de los listados, notes = las notas del acorde en octava 4 (ej ["C4","E4","G4"]).
- Si type = "rhythm": kind="rhythm", pattern = arreglo de 8 o 16 enteros 0/1 (0=silencio, 1=golpe), bpm entre 60 y 140.

Las opciones deben incluir la correcta y 3 distractores plausibles. Ajusta la dificultad al nivel indicado. Responde solo el JSON.`;

    const userPrompt = `Genera ${count} ejercicios de la categoría "${category}" para un estudiante de nivel "${level}" de ${instrument}.
${Number.isFinite(recentAccuracy) ? `Precisión reciente del alumno: ${recentAccuracy}%.` : ''}
${focus ? `Áreas de enfoque: ${focus}.` : ''}
Adapta la dificultad y varía los ejercicios.`;

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
        temperature: 0.8,
        response_format: { type: 'json_object' },
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
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('IA devolvió JSON inválido');
    }

    return new Response(JSON.stringify({ success: true, session: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('ear-training error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
