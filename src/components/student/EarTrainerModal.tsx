import { useState, useRef, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Ear, Loader2, Play, RotateCcw, Sparkles, Check, X, TrendingUp, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { INSTRUMENT_PLAN_MAP, type InstrumentSlug } from '@/lib/instrument-access';

// ---------- Web Audio helpers ----------
const NOTE_TO_MIDI: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};
const noteToFreq = (note: string): number => {
  const m = /^([A-G](?:#|b)?)(\d)$/.exec(note.trim());
  if (!m) return 440;
  const semis = NOTE_TO_MIDI[m[1]];
  const octave = Number(m[2]);
  const midi = 12 * (octave + 1) + semis;
  return 440 * Math.pow(2, (midi - 69) / 12);
};
const CHORD_INTERVALS: Record<string, number[]> = {
  maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
  maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10],
};
const transpose = (note: string, semitones: number): string => {
  const m = /^([A-G](?:#|b)?)(\d)$/.exec(note.trim());
  if (!m) return note;
  const semis = NOTE_TO_MIDI[m[1]];
  const octave = Number(m[2]);
  const midi = 12 * (octave + 1) + semis + semitones;
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const octOut = Math.floor(midi / 12) - 1;
  return `${names[((midi % 12) + 12) % 12]}${octOut}`;
};

interface Playback {
  kind: 'interval' | 'chord' | 'rhythm';
  root?: string;
  notes?: string[];
  chordType?: keyof typeof CHORD_INTERVALS;
  pattern?: number[];
  bpm?: number;
}
interface Exercise {
  id: string;
  type: 'interval' | 'chord' | 'rhythm';
  prompt: string;
  hint?: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  playback: Playback;
}
interface Session {
  title: string;
  description: string;
  exercises: Exercise[];
  tipsForImprovement?: string[];
}

const playNote = (ctx: AudioContext, freq: number, start: number, duration: number, gain = 0.25) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
};

const playClick = (ctx: AudioContext, start: number, accent = false) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = accent ? 1400 : 900;
  g.gain.setValueAtTime(0.35, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
  osc.connect(g).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + 0.1);
};

const playExercise = async (pb: Playback) => {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const now = ctx.currentTime + 0.05;
  if (pb.kind === 'interval' && pb.notes && pb.notes.length >= 2) {
    playNote(ctx, noteToFreq(pb.notes[0]), now, 0.7);
    playNote(ctx, noteToFreq(pb.notes[1]), now + 0.75, 0.7);
  } else if (pb.kind === 'chord') {
    let notes = pb.notes && pb.notes.length ? pb.notes : [];
    if ((!notes.length) && pb.root && pb.chordType && CHORD_INTERVALS[pb.chordType]) {
      notes = CHORD_INTERVALS[pb.chordType].map((s) => transpose(pb.root!, s));
    }
    notes.forEach((n) => playNote(ctx, noteToFreq(n), now, 1.4, 0.18));
  } else if (pb.kind === 'rhythm' && pb.pattern) {
    const bpm = pb.bpm ?? 90;
    const step = 60 / bpm / 2; // 8th notes
    pb.pattern.forEach((v, i) => {
      if (v) playClick(ctx, now + i * step, i % 4 === 0);
    });
  }
  // Clean up
  setTimeout(() => ctx.close(), 4000);
};

interface HistoryRow {
  id: string;
  category: string;
  level: string;
  accuracy: number;
  count: number;
  correct: number;
  per_type: Record<string, number>;
  created_at: string;
}
interface AdaptiveInfo {
  level?: string;
  smoothedAccuracy?: number | null;
  weakTypes?: string[];
  adjustmentNote?: string;
}

export const EarTrainerModal = () => {
  const { data: userIns } = useUserInstrument();
  const { user } = useAuth();
  const primary = (userIns?.instrument ?? null) as InstrumentSlug | null;
  const instrumentLabel = primary ? INSTRUMENT_PLAN_MAP[primary]?.label : 'general';

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<'intervals' | 'chords' | 'rhythms' | 'mixed'>('intervals');
  const [level, setLevel] = useState('principiante');
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [correctByEx, setCorrectByEx] = useState<boolean[]>([]);
  const [correct, setCorrect] = useState(0);
  const [adaptive, setAdaptive] = useState<AdaptiveInfo | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const savedRef = useRef(false);
  const { toast } = useToast();

  const finished = useMemo(
    () => session && answered.length === session.exercises.length && answered.every(Boolean),
    [session, answered],
  );

  const loadHistory = async () => {
    if (!user?.id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('ear_training_sessions' as any)
      .select('id, category, level, accuracy, count, correct, per_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10) as any);
    if (Array.isArray(data)) setHistory(data as HistoryRow[]);
  };

  useEffect(() => { if (open) loadHistory(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, user?.id]);

  const startSession = async () => {
    setLoading(true);
    setSession(null);
    setAdaptive(null);
    savedRef.current = false;
    try {
      const recentAccuracy = history[0]?.accuracy;
      const historyPayload = history.slice(0, 5).map(h => ({
        accuracy: h.accuracy, level: h.level, category: h.category, perType: h.per_type,
      }));
      const { data, error } = await supabase.functions.invoke('ear-training', {
        body: {
          category, level, instrument: instrumentLabel, count,
          recentAccuracy,
          history: historyPayload,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error');
      const s: Session = data.session;
      if (!s?.exercises?.length) throw new Error('Sesión sin ejercicios');
      setSession(s);
      setAdaptive(data.adaptive ?? null);
      if (data.adaptive?.level && data.adaptive.level !== level) {
        setLevel(data.adaptive.level);
      }
      setCurrent(0);
      setSelected(null);
      setAnswered(new Array(s.exercises.length).fill(false));
      setCorrectByEx(new Array(s.exercises.length).fill(false));
      setCorrect(0);
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'No se pudo crear la sesión',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = () => {
    if (!session || selected === null) return;
    const ex = session.exercises[current];
    const isCorrect = selected === ex.answerIndex;
    setAnswered((prev) => { const n = [...prev]; n[current] = true; return n; });
    setCorrectByEx((prev) => { const n = [...prev]; n[current] = isCorrect; return n; });
    if (isCorrect) setCorrect((c) => c + 1);
  };

  const saveSession = async (finalCorrect: number) => {
    if (!session || !user?.id || savedRef.current) return;
    savedRef.current = true;
    const accuracy = Math.round((finalCorrect / session.exercises.length) * 100);
    // Per-type accuracy
    const buckets: Record<string, { c: number; n: number }> = {};
    session.exercises.forEach((ex, i) => {
      const t = ex.type;
      if (!buckets[t]) buckets[t] = { c: 0, n: 0 };
      buckets[t].n += 1;
      if (correctByEx[i]) buckets[t].c += 1;
    });
    const per_type: Record<string, number> = {};
    Object.entries(buckets).forEach(([k, v]) => { per_type[k] = Math.round((v.c / v.n) * 100); });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('ear_training_sessions' as any).insert({
      user_id: user.id,
      category, level, instrument: instrumentLabel,
      count: session.exercises.length,
      correct: finalCorrect,
      accuracy,
      per_type,
    }) as any);
    if (!error) loadHistory();
  };

  const nextExercise = () => {
    if (!session) return;
    if (current + 1 < session.exercises.length) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      saveSession(correct);
    }
  };

  const resetAll = () => {
    setSession(null);
    setAdaptive(null);
    setCurrent(0);
    setSelected(null);
    setAnswered([]);
    setCorrectByEx([]);
    setCorrect(0);
  };

  const ex = session?.exercises[current];
  const hasAnswered = ex ? answered[current] : false;
  const accuracy = session ? Math.round((correct / session.exercises.length) * 100) : 0;
  const avgHistory = history.length
    ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / history.length)
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Ear className="w-4 h-4" />
          Entrenador de Oído
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ear className="w-5 h-5 text-primary" />
            Entrenador de Oído IA
          </DialogTitle>
          <DialogDescription>
            Ejercicios personalizados de intervalos, acordes y ritmos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {!session ? (
            <ScrollArea className="h-full pr-3">
              <div className="space-y-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intervals">Intervalos</SelectItem>
                        <SelectItem value="chords">Acordes</SelectItem>
                        <SelectItem value="rhythms">Ritmos</SelectItem>
                        <SelectItem value="mixed">Mezcla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nivel</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="principiante">Principiante</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ejercicios</Label>
                    <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[4, 6, 8, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} ejercicios</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {lastAccuracy.current !== null && (
                  <p className="text-sm text-muted-foreground">
                    Última sesión: <span className="font-semibold text-primary">{lastAccuracy.current}%</span> — la IA usará este dato para adaptar la dificultad.
                  </p>
                )}
                <Button onClick={startSession} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Generando ejercicios...' : 'Comenzar sesión'}
                </Button>
              </div>
            </ScrollArea>
          ) : finished ? (
            <ScrollArea className="h-full pr-3">
              <div className="space-y-4 pb-4 text-center">
                <div className="py-4">
                  <div className="text-5xl font-bold text-primary">{accuracy}%</div>
                  <p className="text-muted-foreground mt-2">
                    {correct} de {session.exercises.length} correctas
                  </p>
                </div>
                {session.tipsForImprovement?.length ? (
                  <div className="text-left bg-muted rounded-lg p-4 space-y-2">
                    <p className="font-semibold">Consejos para mejorar:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {session.tipsForImprovement.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                ) : null}
                <div className="flex gap-2 justify-center">
                  <Button onClick={resetAll} variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" /> Nueva sesión
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : ex ? (
            <div className="h-full flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Ejercicio {current + 1} de {session.exercises.length}</span>
                  <span className="text-primary font-semibold">{correct} correctas</span>
                </div>
                <Progress value={((current + (hasAnswered ? 1 : 0)) / session.exercises.length) * 100} />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="font-medium">{ex.prompt}</p>
                {ex.hint && <p className="text-xs text-muted-foreground">💡 {ex.hint}</p>}
                <Button onClick={() => playExercise(ex.playback)} variant="secondary" className="gap-2">
                  <Play className="w-4 h-4" /> Escuchar
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ex.options.map((opt, i) => {
                  const isRight = hasAnswered && i === ex.answerIndex;
                  const isWrongSel = hasAnswered && i === selected && selected !== ex.answerIndex;
                  return (
                    <Button
                      key={i}
                      variant={selected === i ? 'default' : 'outline'}
                      disabled={hasAnswered}
                      onClick={() => setSelected(i)}
                      className={`justify-start gap-2 h-auto py-3 text-left ${
                        isRight ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : ''
                      } ${isWrongSel ? 'border-red-500 bg-red-500/10 text-red-500' : ''}`}
                    >
                      {isRight && <Check className="w-4 h-4" />}
                      {isWrongSel && <X className="w-4 h-4" />}
                      <span className="flex-1">{opt}</span>
                    </Button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-semibold mb-1">
                    {selected === ex.answerIndex ? '¡Correcto! 🎉' : `Respuesta: ${ex.options[ex.answerIndex]}`}
                  </p>
                  <p className="text-muted-foreground">{ex.explanation}</p>
                </div>
              )}

              <div className="mt-auto flex gap-2">
                {!hasAnswered ? (
                  <Button onClick={submitAnswer} disabled={selected === null} className="flex-1">
                    Responder
                  </Button>
                ) : (
                  <Button onClick={nextExercise} className="flex-1">
                    {current + 1 < session.exercises.length ? 'Siguiente' : 'Ver resultados'}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
