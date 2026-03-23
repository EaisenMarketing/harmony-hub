import { useState, useRef, useCallback, useEffect } from 'react';
import { Timer, Mic, Play, Pause, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Metronome Logic ───────────────────────────────────────────────
const useMetronome = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  const playClick = useCallback((accent: boolean) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = accent ? 1000 : 700;
    gain.gain.setValueAtTime(accent ? 0.6 : 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, []);

  const start = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    beatRef.current = 0;
    setCurrentBeat(0);
    setIsPlaying(true);

    const ms = (60 / bpm) * 1000;
    // play first beat immediately
    playClick(true);
    setCurrentBeat(1);
    beatRef.current = 1;

    intervalRef.current = window.setInterval(() => {
      beatRef.current = (beatRef.current % beatsPerMeasure) + 1;
      setCurrentBeat(beatRef.current);
      playClick(beatRef.current === 1);
    }, ms);
  }, [bpm, beatsPerMeasure, playClick]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    beatRef.current = 0;
  }, []);

  // Restart if bpm changes while playing
  useEffect(() => {
    if (isPlaying) {
      stop();
      // small delay to avoid audio glitch
      const t = setTimeout(() => start(), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, beatsPerMeasure]);

  // cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { bpm, setBpm, isPlaying, currentBeat, beatsPerMeasure, setBeatsPerMeasure, start, stop };
};

// ─── Tuner Logic ───────────────────────────────────────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(freq: number) {
  const noteNum = 12 * (Math.log2(freq / 440));
  const rounded = Math.round(noteNum);
  const cents = Math.round((noteNum - rounded) * 100);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor((rounded + 69) / 12) - 1;
  return { note: NOTE_NAMES[(noteIndex + 9) % 12], octave, cents, frequency: freq };
}

function autoCorrelate(buf: Float32Array, sampleRate: number) {
  let size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return -1;

  // trim silence
  let r1 = 0, r2 = size - 1;
  const threshold = 0.2;
  for (let i = 0; i < size / 2; i++) { if (Math.abs(buf[i]) < threshold) { r1 = i; break; } }
  for (let i = 1; i < size / 2; i++) { if (Math.abs(buf[size - i]) < threshold) { r2 = size - i; break; } }

  buf = buf.slice(r1, r2);
  size = buf.length;

  const c = new Array(size).fill(0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;

  let maxVal = -1, maxPos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
  }

  // parabolic interpolation
  const t0 = maxPos > 0 ? c[maxPos - 1] : c[maxPos];
  const t1 = c[maxPos];
  const t2 = maxPos < size - 1 ? c[maxPos + 1] : c[maxPos];
  const a = (t0 + t2 - 2 * t1) / 2;
  const b = (t2 - t0) / 2;
  if (a) maxPos = maxPos - b / (2 * a);

  return sampleRate / maxPos;
}

const useTuner = () => {
  const [isListening, setIsListening] = useState(false);
  const [noteInfo, setNoteInfo] = useState<{ note: string; octave: number; cents: number; frequency: number } | null>(null);
  const animRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsListening(true);

      const buf = new Float32Array(analyser.fftSize);
      const detect = () => {
        analyser.getFloatTimeDomainData(buf);
        const freq = autoCorrelate(buf, ctx.sampleRate);
        if (freq > 0 && freq < 2000) {
          setNoteInfo(frequencyToNote(freq));
        }
        animRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch {
      console.error('Microphone access denied');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    setNoteInfo(null);
  }, []);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { isListening, noteInfo, startListening, stopListening };
};

// ─── Component ─────────────────────────────────────────────────────
export const MetronomeTunerModal = () => {
  const [open, setOpen] = useState(false);
  const metronome = useMetronome();
  const tuner = useTuner();

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      metronome.stop();
      tuner.stopListening();
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Timer className="w-4 h-4" />
          <span className="hidden sm:inline">Metrónomo / Afinador</span>
          <span className="sm:hidden">Tempo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🎵 Metrónomo & Afinador</DialogTitle>
          <DialogDescription>Herramientas esenciales para tu práctica musical</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="metronome" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metronome" className="gap-2">
              <Timer className="w-4 h-4" /> Metrónomo
            </TabsTrigger>
            <TabsTrigger value="tuner" className="gap-2">
              <Mic className="w-4 h-4" /> Afinador
            </TabsTrigger>
          </TabsList>

          {/* ── Metronome Tab ── */}
          <TabsContent value="metronome" className="space-y-6 pt-4">
            {/* BPM Display */}
            <div className="text-center">
              <span className="text-6xl font-bold text-foreground tabular-nums">
                {metronome.bpm}
              </span>
              <p className="text-muted-foreground text-sm mt-1">BPM</p>
            </div>

            {/* BPM Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => metronome.setBpm(Math.max(20, metronome.bpm - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Slider
                value={[metronome.bpm]}
                onValueChange={([v]) => metronome.setBpm(v)}
                min={20}
                max={300}
                step={1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => metronome.setBpm(Math.min(300, metronome.bpm + 1))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Beat Indicator */}
            <div className="flex justify-center gap-3">
              {Array.from({ length: metronome.beatsPerMeasure }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-all duration-100',
                    metronome.currentBeat === i + 1
                      ? i === 0
                        ? 'bg-primary border-primary scale-125 shadow-lg shadow-primary/40'
                        : 'bg-secondary border-secondary scale-110'
                      : 'border-muted-foreground/30 bg-transparent'
                  )}
                />
              ))}
            </div>

            {/* Time Signature */}
            <div className="flex justify-center gap-2">
              {[2, 3, 4, 6].map(n => (
                <Button
                  key={n}
                  variant={metronome.beatsPerMeasure === n ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => metronome.setBeatsPerMeasure(n)}
                >
                  {n}/4
                </Button>
              ))}
            </div>

            {/* Tempo Presets */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: 'Largo', bpm: 50 },
                { label: 'Andante', bpm: 80 },
                { label: 'Moderato', bpm: 110 },
                { label: 'Allegro', bpm: 140 },
                { label: 'Presto', bpm: 180 },
              ].map(p => (
                <Button
                  key={p.label}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => metronome.setBpm(p.bpm)}
                >
                  {p.label} ({p.bpm})
                </Button>
              ))}
            </div>

            {/* Play/Stop */}
            <div className="flex justify-center">
              <Button
                size="lg"
                className="w-32 gap-2"
                onClick={metronome.isPlaying ? metronome.stop : metronome.start}
              >
                {metronome.isPlaying ? (
                  <><Pause className="w-5 h-5" /> Parar</>
                ) : (
                  <><Play className="w-5 h-5" /> Iniciar</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* ── Tuner Tab ── */}
          <TabsContent value="tuner" className="space-y-6 pt-4">
            <div className="text-center space-y-4">
              {/* Note Display */}
              <div className="relative">
                <span className={cn(
                  'text-7xl font-bold transition-colors',
                  tuner.noteInfo
                    ? Math.abs(tuner.noteInfo.cents) < 5
                      ? 'text-green-500'
                      : Math.abs(tuner.noteInfo.cents) < 15
                        ? 'text-yellow-500'
                        : 'text-destructive'
                    : 'text-muted-foreground/30'
                )}>
                  {tuner.noteInfo?.note || '—'}
                </span>
                {tuner.noteInfo && (
                  <span className="text-2xl text-muted-foreground ml-1">
                    {tuner.noteInfo.octave}
                  </span>
                )}
              </div>

              {/* Cents indicator */}
              {tuner.noteInfo && (
                <div className="space-y-2">
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-foreground/50 z-10" />
                    <div
                      className={cn(
                        'absolute top-0 h-full w-3 rounded-full transition-all',
                        Math.abs(tuner.noteInfo.cents) < 5
                          ? 'bg-green-500'
                          : Math.abs(tuner.noteInfo.cents) < 15
                            ? 'bg-yellow-500'
                            : 'bg-destructive'
                      )}
                      style={{
                        left: `${50 + tuner.noteInfo.cents * 0.5}%`,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground max-w-xs mx-auto">
                    <span>♭ Bajo</span>
                    <span className="font-medium">
                      {tuner.noteInfo.cents > 0 ? '+' : ''}{tuner.noteInfo.cents} cents
                    </span>
                    <span>Alto ♯</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tuner.noteInfo.frequency.toFixed(1)} Hz
                  </p>
                </div>
              )}

              {!tuner.isListening && !tuner.noteInfo && (
                <p className="text-muted-foreground text-sm">
                  Toca una nota y el afinador detectará el tono automáticamente
                </p>
              )}
            </div>

            {/* Start/Stop */}
            <div className="flex justify-center">
              <Button
                size="lg"
                className="w-40 gap-2"
                variant={tuner.isListening ? 'destructive' : 'default'}
                onClick={tuner.isListening ? tuner.stopListening : tuner.startListening}
              >
                <Mic className={cn('w-5 h-5', tuner.isListening && 'animate-pulse')} />
                {tuner.isListening ? 'Detener' : 'Activar Micrófono'}
              </Button>
            </div>

            {tuner.isListening && (
              <p className="text-center text-xs text-muted-foreground animate-pulse">
                🎤 Escuchando...
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
