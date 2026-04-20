import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, BookOpen, Lightbulb, Target, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ───────────────────────────────────────────────────────────
// Tipos
// ───────────────────────────────────────────────────────────
type Cell = 1 | 0; // 1 = ataque, 0 = silencio
type Exercise = {
  id: string;
  title: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  timeSignature: '4/4' | '3/4' | '6/8';
  subdivision: number; // celdas por compás
  pattern: Cell[]; // longitud = subdivision
  description: string;
  tip: string;
};

// ───────────────────────────────────────────────────────────
// Biblioteca de ejercicios (basados en el manual de rítmica y métrica)
// ───────────────────────────────────────────────────────────
const EXERCISES: Exercise[] = [
  {
    id: 'negras-4-4',
    title: 'Pulso básico — Negras en 4/4',
    level: 'Principiante',
    timeSignature: '4/4',
    subdivision: 4,
    pattern: [1, 1, 1, 1],
    description: 'El pulso es el latido constante de la música. Toca una nota en cada tiempo.',
    tip: 'Cuenta en voz alta: 1 - 2 - 3 - 4. Mantén el cuerpo relajado.',
  },
  {
    id: 'corcheas-4-4',
    title: 'Corcheas — Subdivisión binaria',
    level: 'Principiante',
    timeSignature: '4/4',
    subdivision: 8,
    pattern: [1, 1, 1, 1, 1, 1, 1, 1],
    description: 'Cada tiempo se divide en dos partes iguales. Cuenta: 1 y 2 y 3 y 4 y.',
    tip: 'Las corcheas deben sonar parejas, sin acentuar las "y".',
  },
  {
    id: 'sincopa-basica',
    title: 'Síncopa básica',
    level: 'Intermedio',
    timeSignature: '4/4',
    subdivision: 8,
    pattern: [1, 0, 1, 1, 0, 1, 1, 0],
    description: 'La síncopa desplaza el acento del tiempo fuerte al débil, generando tensión rítmica.',
    tip: 'Siente el pulso aunque no lo toques. El silencio es tan importante como el ataque.',
  },
  {
    id: 'tresillo',
    title: 'Tresillo — Subdivisión ternaria',
    level: 'Intermedio',
    timeSignature: '4/4',
    subdivision: 12,
    pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    description: 'Cada tiempo se divide en tres partes iguales. Cuenta: 1-tre-sí, 2-tre-sí...',
    tip: 'Imagina la palabra "manzana" repetida sobre cada tiempo.',
  },
  {
    id: 'vals-3-4',
    title: 'Vals — 3/4',
    level: 'Principiante',
    timeSignature: '3/4',
    subdivision: 3,
    pattern: [1, 1, 1],
    description: 'Compás ternario. El primer tiempo es fuerte, los otros dos débiles.',
    tip: 'Acentúa mentalmente el "1": UNO - dos - tres.',
  },
  {
    id: 'seis-ocho',
    title: 'Compuesto 6/8',
    level: 'Intermedio',
    timeSignature: '6/8',
    subdivision: 6,
    pattern: [1, 0, 0, 1, 0, 0],
    description: 'Compás compuesto. Dos pulsos principales, cada uno subdividido en tres.',
    tip: 'Cuenta: UN-dos-tres CUA-tro-cinco. Es el ritmo de muchas baladas.',
  },
  {
    id: 'clave-son',
    title: 'Clave de son cubana (3-2)',
    level: 'Avanzado',
    timeSignature: '4/4',
    subdivision: 16,
    pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    description: 'Patrón fundamental de la música afrocubana. Base del son, salsa y mambo.',
    tip: 'Memoriza el patrón antes de subir el tempo. Dilo: "ta-ki-ta-ki-ta".',
  },
  {
    id: 'polirritmia-3-2',
    title: 'Polirritmia 3 contra 2',
    level: 'Avanzado',
    timeSignature: '4/4',
    subdivision: 12,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    description: 'Tres golpes en el espacio de dos tiempos. Sentir dos métricas simultáneas.',
    tip: 'Frase mnemotécnica: "pásame el pan" (3 contra 2).',
  },
];

// ───────────────────────────────────────────────────────────
// Audio engine (Web Audio API)
// ───────────────────────────────────────────────────────────
function createClick(ctx: AudioContext, time: number, isDownbeat: boolean, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = isDownbeat ? 1500 : 900;
  osc.type = 'square';
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(isDownbeat ? 0.45 : 0.28, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.06);
}

function createWoodblock(ctx: AudioContext, time: number, accent: boolean, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = accent ? 1800 : 1200;
  filter.Q.value = 8;
  osc.type = 'triangle';
  osc.frequency.value = accent ? 1800 : 1200;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(accent ? 0.6 : 0.45, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
  osc.connect(filter).connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.1);
}

// ───────────────────────────────────────────────────────────
// Componente principal
// ───────────────────────────────────────────────────────────
export const RhythmExercises = () => {
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [exerciseOn, setExerciseOn] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [selectedId, setSelectedId] = useState<string>(EXERCISES[0].id);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const stepRef = useRef(0);
  const beatRef = useRef(0);

  const exercise = EXERCISES.find((e) => e.id === selectedId) ?? EXERCISES[0];
  const beatsPerBar = exercise.timeSignature === '3/4' ? 3 : exercise.timeSignature === '6/8' ? 6 : 4;
  const stepsPerBeat = exercise.subdivision / beatsPerBar;

  // Init audio
  const initAudio = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
  }, []);

  // Scheduler look-ahead (25ms)
  const scheduler = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    const stepDur = 60.0 / bpm / stepsPerBeat;

    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const step = stepRef.current;
      const beat = Math.floor(step / stepsPerBeat);
      const isDownbeat = step === 0;
      const isBeat = step % stepsPerBeat === 0;

      // Metrónomo (en cada tiempo, no en cada subdivisión)
      if (metronomeOn && isBeat) {
        createClick(ctx, nextNoteTimeRef.current, isDownbeat, master);
      }

      // Patrón del ejercicio
      if (exerciseOn && exercise.pattern[step] === 1) {
        createWoodblock(ctx, nextNoteTimeRef.current, isDownbeat, master);
      }

      // Programar UI update
      const stepCopy = step;
      const beatCopy = beat;
      const delay = (nextNoteTimeRef.current - ctx.currentTime) * 1000;
      window.setTimeout(() => {
        setCurrentStep(stepCopy);
        setCurrentBeat(beatCopy);
      }, Math.max(0, delay));

      nextNoteTimeRef.current += stepDur;
      stepRef.current = (stepRef.current + 1) % exercise.subdivision;
      if (stepRef.current === 0) beatRef.current = 0;
    }

    schedulerRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, stepsPerBeat, metronomeOn, exerciseOn, exercise]);

  const start = useCallback(() => {
    initAudio();
    const ctx = ctxRef.current;
    if (!ctx) return;
    stepRef.current = 0;
    beatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    setIsPlaying(true);
    scheduler();
  }, [initAudio, scheduler]);

  const stop = useCallback(() => {
    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
    setCurrentBeat(0);
  }, []);

  // Reiniciar al cambiar ejercicio o BPM
  useEffect(() => {
    if (isPlaying) {
      stop();
      const t = setTimeout(start, 60);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, bpm, metronomeOn, exerciseOn]);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearTimeout(schedulerRef.current);
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="exercises">
            <Music2 className="w-4 h-4 mr-2" /> Ejercicios
          </TabsTrigger>
          <TabsTrigger value="theory">
            <BookOpen className="w-4 h-4 mr-2" /> ¿Qué es la rítmica?
          </TabsTrigger>
        </TabsList>

        {/* ─── Ejercicios ─── */}
        <TabsContent value="exercises" className="space-y-4 mt-4">
          {/* Selector de ejercicio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecciona un ejercicio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EXERCISES.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedId(ex.id)}
                    className={cn(
                      'text-left p-3 rounded-lg border transition-all',
                      selectedId === ex.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground line-clamp-1">{ex.title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {ex.timeSignature}
                      </Badge>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px]',
                        ex.level === 'Principiante' && 'bg-emerald-500/15 text-emerald-500',
                        ex.level === 'Intermedio' && 'bg-amber-500/15 text-amber-500',
                        ex.level === 'Avanzado' && 'bg-rose-500/15 text-rose-500'
                      )}
                    >
                      {ex.level}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Player */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{exercise.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{exercise.description}</p>
                </div>
                <Badge variant="outline" className="shrink-0">{exercise.timeSignature}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Visualizador del patrón */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Patrón rítmico</span>
                  <span>Tiempo: {currentBeat + 1} / {beatsPerBar}</span>
                </div>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${exercise.subdivision}, minmax(0, 1fr))` }}
                >
                  {exercise.pattern.map((cell, i) => {
                    const isBeatStart = i % stepsPerBeat === 0;
                    const isActive = isPlaying && i === currentStep;
                    return (
                      <div
                        key={i}
                        className={cn(
                          'aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-all',
                          cell === 1 ? 'bg-primary/80 text-primary-foreground' : 'bg-muted/40 text-muted-foreground',
                          isBeatStart && 'ring-2 ring-primary/40',
                          isActive && 'scale-110 ring-4 ring-amber-400 shadow-lg shadow-amber-400/30'
                        )}
                      >
                        {isBeatStart ? Math.floor(i / stepsPerBeat) + 1 : '·'}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Indicador de pulso (luces grandes) */}
              <div className="flex justify-center gap-3">
                {Array.from({ length: beatsPerBar }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-4 h-4 rounded-full transition-all',
                      isPlaying && currentBeat === i
                        ? i === 0
                          ? 'bg-rose-500 scale-125 shadow-lg shadow-rose-500/50'
                          : 'bg-emerald-500 scale-125 shadow-lg shadow-emerald-500/50'
                        : 'bg-muted'
                    )}
                  />
                ))}
              </div>

              {/* Controles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Button
                    onClick={isPlaying ? stop : start}
                    size="lg"
                    className="flex-1 gap-2"
                    variant={isPlaying ? 'destructive' : 'default'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? 'Detener' : 'Reproducir'}
                  </Button>
                  <div className="text-center min-w-[80px]">
                    <div className="text-3xl font-bold text-foreground tabular-nums">{bpm}</div>
                    <div className="text-xs text-muted-foreground">BPM</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tempo</span>
                    <span>40 — 200 BPM</span>
                  </div>
                  <Slider
                    value={[bpm]}
                    onValueChange={(v) => setBpm(v[0])}
                    min={40}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={metronomeOn ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMetronomeOn((v) => !v)}
                  >
                    🔔 Metrónomo {metronomeOn ? 'ON' : 'OFF'}
                  </Button>
                  <Button
                    variant={exerciseOn ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExerciseOn((v) => !v)}
                  >
                    🪵 Patrón {exerciseOn ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>

              {/* Tip */}
              <div className="flex gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground"><span className="font-semibold">Tip:</span> {exercise.tip}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Teoría ─── */}
        <TabsContent value="theory" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> ¿Qué es la rítmica?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/90">
              <p>
                La <strong>rítmica</strong> es la organización del sonido en el tiempo. Estudia cómo se
                distribuyen los <strong>ataques</strong> (notas) y los <strong>silencios</strong> dentro de
                una pulsación regular llamada <strong>pulso</strong>.
              </p>
              <p>
                La <strong>métrica</strong> agrupa esos pulsos en unidades llamadas <strong>compases</strong>,
                marcadas por una cifra como <em>4/4</em>, <em>3/4</em> o <em>6/8</em>. El primer tiempo de
                cada compás suele ser el más fuerte (acento métrico).
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <h4 className="font-semibold mb-1 text-foreground">Pulso</h4>
                  <p className="text-xs text-muted-foreground">El latido constante que sostiene la música. Como el tic-tac de un reloj.</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <h4 className="font-semibold mb-1 text-foreground">Subdivisión</h4>
                  <p className="text-xs text-muted-foreground">División del pulso en partes iguales: binaria (corcheas) o ternaria (tresillos).</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <h4 className="font-semibold mb-1 text-foreground">Acento</h4>
                  <p className="text-xs text-muted-foreground">Tiempo o nota destacada. En 4/4 los acentos están en 1 y 3.</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <h4 className="font-semibold mb-1 text-foreground">Síncopa</h4>
                  <p className="text-xs text-muted-foreground">Acento desplazado a un tiempo débil. Genera tensión y groove.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> ¿Cómo estudiar rítmica?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground/90">
              <ol className="space-y-3 list-decimal list-inside">
                <li>
                  <strong>Empieza siempre con metrónomo.</strong> Sin pulso estable no hay ritmo. Comienza a
                  tempos lentos (60–80 BPM).
                </li>
                <li>
                  <strong>Cuenta en voz alta.</strong> Verbalizar la subdivisión ("1 y 2 y") interioriza el pulso
                  mejor que solo escuchar.
                </li>
                <li>
                  <strong>Marca el pulso con el cuerpo.</strong> Pie, cabeza o palmas. El ritmo es físico antes
                  que intelectual.
                </li>
                <li>
                  <strong>Aísla el patrón.</strong> Practica el ejercicio sin tu instrumento primero: solo
                  palmas o vocalización (ta-ka-di-mi).
                </li>
                <li>
                  <strong>Sube el tempo gradualmente.</strong> +5 BPM solo cuando puedas tocarlo perfecto 3
                  veces seguidas.
                </li>
                <li>
                  <strong>Graba y escúchate.</strong> Detectarás desfases que no notas tocando.
                </li>
                <li>
                  <strong>Practica poco y a diario.</strong> 10 minutos al día rinden más que 1 hora a la semana.
                </li>
              </ol>

              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-foreground">
                  <strong>📚 Referencia:</strong> Ejercicios inspirados en el manual de{' '}
                  <em>Rítmica y Métrica</em> (Universidad de la República, Uruguay).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
