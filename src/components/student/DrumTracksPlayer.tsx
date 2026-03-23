import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, Volume2 } from 'lucide-react';

interface DrumPattern {
  name: string;
  style: string;
  kick: number[];
  snare: number[];
  hihat: number[];
  steps: number;
  defaultBpm: number;
}

const DRUM_PATTERNS: DrumPattern[] = [
  {
    name: 'Rock Básico',
    style: 'Rock',
    kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    steps: 16, defaultBpm: 110,
  },
  {
    name: 'Pop Groove',
    style: 'Pop',
    kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    steps: 16, defaultBpm: 100,
  },
  {
    name: 'Funk',
    style: 'Funk',
    kick:  [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,0,0],
    snare: [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    steps: 16, defaultBpm: 95,
  },
  {
    name: 'Bossa Nova',
    style: 'Latin',
    kick:  [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
    snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    hihat: [1,0,1,1, 0,1,1,0, 1,1,0,1, 1,0,1,0],
    steps: 16, defaultBpm: 130,
  },
  {
    name: 'Blues Shuffle',
    style: 'Blues',
    kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,1, 0,1,1,0, 1,1,0,1, 1,0,1,0],
    steps: 16, defaultBpm: 80,
  },
  {
    name: 'Reggaeton',
    style: 'Urbano',
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    steps: 16, defaultBpm: 90,
  },
  {
    name: 'Metal Double Bass',
    style: 'Metal',
    kick:  [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    steps: 16, defaultBpm: 140,
  },
  {
    name: 'Jazz Swing',
    style: 'Jazz',
    kick:  [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    snare: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
    hihat: [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
    steps: 16, defaultBpm: 135,
  },
];

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export const DrumTracksPlayer = () => {
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [bpm, setBpm] = useState(DRUM_PATTERNS[0].defaultBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [volume, setVolume] = useState(80);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const gainRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      gainRef.current = audioCtxRef.current.createGain();
      gainRef.current.connect(audioCtxRef.current.destination);
    }
    gainRef.current!.gain.value = volume / 100;
    return audioCtxRef.current;
  }, [volume]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume / 100;
  }, [volume]);

  const playKick = useCallback((ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
    g.gain.setValueAtTime(1, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(g);
    g.connect(gainRef.current!);
    osc.start(time);
    osc.stop(time + 0.15);
  }, []);

  const playSnare = useCallback((ctx: AudioContext, time: number) => {
    // Noise part
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.1);
    const nf = ctx.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = 1000;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.6, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(gainRef.current!);
    noise.start(time);
    // Body
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, time);
    g.gain.setValueAtTime(0.5, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(g);
    g.connect(gainRef.current!);
    osc.start(time);
    osc.stop(time + 0.08);
  }, []);

  const playHihat = useCallback((ctx: AudioContext, time: number) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.05);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(f);
    f.connect(g);
    g.connect(gainRef.current!);
    noise.start(time);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(-1);
    stepRef.current = 0;
  }, []);

  const play = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const pattern = DRUM_PATTERNS[selectedPattern];
    stepRef.current = 0;

    const stepDuration = (60 / bpm / 4) * 1000; // 16th notes

    intervalRef.current = window.setInterval(() => {
      const step = stepRef.current % pattern.steps;
      const time = ctx.currentTime;
      if (pattern.kick[step]) playKick(ctx, time);
      if (pattern.snare[step]) playSnare(ctx, time);
      if (pattern.hihat[step]) playHihat(ctx, time);
      setCurrentStep(step);
      stepRef.current++;
    }, stepDuration);

    setIsPlaying(true);
  }, [selectedPattern, bpm, getAudioContext, playKick, playSnare, playHihat]);

  const togglePlay = () => {
    if (isPlaying) stop();
    else play();
  };

  // Stop on pattern change
  useEffect(() => {
    if (isPlaying) { stop(); }
    setBpm(DRUM_PATTERNS[selectedPattern].defaultBpm);
  }, [selectedPattern]);

  // Cleanup
  useEffect(() => () => { stop(); }, [stop]);

  const pattern = DRUM_PATTERNS[selectedPattern];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">🥁 Tracks de Batería</h2>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selecciona un patrón</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DRUM_PATTERNS.map((p, i) => (
              <Button
                key={i}
                variant={selectedPattern === i ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-auto py-2 flex flex-col"
                onClick={() => setSelectedPattern(i)}
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-[10px] opacity-70">{p.style}</span>
              </Button>
            ))}
          </div>

          {/* Step visualizer */}
          <div className="space-y-1.5">
            {(['kick', 'snare', 'hihat'] as const).map(drum => (
              <div key={drum} className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0 text-right">
                  {drum === 'kick' ? 'Bombo' : drum === 'snare' ? 'Caja' : 'HiHat'}
                </span>
                <div className="flex gap-0.5 flex-1">
                  {pattern[drum].map((val, i) => (
                    <div
                      key={i}
                      className={`h-5 flex-1 rounded-sm transition-all ${
                        currentStep === i
                          ? val ? 'bg-primary scale-110' : 'bg-primary/20'
                          : val ? 'bg-primary/60' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              onClick={togglePlay}
              size="lg"
              className="gap-2"
              variant={isPlaying ? 'destructive' : 'default'}
            >
              {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? 'Detener' : 'Reproducir'}
            </Button>

            <div className="flex items-center gap-3 flex-1 w-full">
              <span className="text-sm text-muted-foreground whitespace-nowrap">BPM: {bpm}</span>
              <Slider
                value={[bpm]}
                onValueChange={([v]) => { setBpm(v); if (isPlaying) { stop(); } }}
                min={40}
                max={200}
                step={1}
                className="flex-1"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                min={0}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
