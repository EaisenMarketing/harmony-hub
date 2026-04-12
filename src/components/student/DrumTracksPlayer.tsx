import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
    name: 'Rock Básico', style: 'Rock',
    kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    steps: 16, defaultBpm: 110,
  },
  {
    name: 'Pop Groove', style: 'Pop',
    kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    steps: 16, defaultBpm: 100,
  },
  {
    name: 'Funk', style: 'Funk',
    kick:  [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,0,0],
    snare: [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    steps: 16, defaultBpm: 95,
  },
  {
    name: 'Bossa Nova', style: 'Latin',
    kick:  [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
    snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    hihat: [1,0,1,1, 0,1,1,0, 1,1,0,1, 1,0,1,0],
    steps: 16, defaultBpm: 130,
  },
  {
    name: 'Blues Shuffle', style: 'Blues',
    kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,1, 0,1,1,0, 1,1,0,1, 1,0,1,0],
    steps: 16, defaultBpm: 80,
  },
  {
    name: 'Reggaeton', style: 'Urbano',
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    steps: 16, defaultBpm: 90,
  },
  {
    name: 'Metal Double Bass', style: 'Metal',
    kick:  [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    steps: 16, defaultBpm: 140,
  },
  {
    name: 'Jazz Swing', style: 'Jazz',
    kick:  [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    snare: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
    hihat: [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
    steps: 16, defaultBpm: 135,
  },
];

// ─── Acoustic Drum Synthesis (Tama/Pearl/Yamaha style) ───

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const len = Math.round(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function createRoomReverb(ctx: AudioContext): ConvolverNode {
  const length = Math.round(ctx.sampleRate * 1.2);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      // Early reflections + diffuse tail
      const env = Math.exp(-i / (ctx.sampleRate * 0.25));
      const early = i < ctx.sampleRate * 0.02 ? Math.exp(-i / (ctx.sampleRate * 0.005)) * 0.5 : 0;
      d[i] = (Math.random() * 2 - 1) * (env * 0.15 + early);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = impulse;
  return conv;
}

let drumReverb: ConvolverNode | null = null;
let drumReverbGain: GainNode | null = null;

function getDrumReverb(ctx: AudioContext, dest: GainNode) {
  if (!drumReverb) {
    drumReverb = createRoomReverb(ctx);
    drumReverbGain = ctx.createGain();
    drumReverbGain.gain.value = 0.2;
    drumReverb.connect(drumReverbGain);
    drumReverbGain.connect(dest);
  }
  return drumReverb;
}

// Acoustic Kick — 22" birch shell with resonant head
function playAcousticKick(ctx: AudioContext, dest: GainNode, time: number) {
  const reverb = getDrumReverb(ctx, dest);

  // Beater click (transient attack)
  const clickNoise = ctx.createBufferSource();
  clickNoise.buffer = createNoiseBuffer(ctx, 0.008);
  const clickBP = ctx.createBiquadFilter();
  clickBP.type = 'bandpass';
  clickBP.frequency.value = 3500;
  clickBP.Q.value = 2;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.7, time);
  clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
  clickNoise.connect(clickBP);
  clickBP.connect(clickGain);
  clickGain.connect(dest);
  clickNoise.start(time);

  // Shell fundamental — deep sine sweep
  const fund = ctx.createOscillator();
  fund.type = 'sine';
  fund.frequency.setValueAtTime(120, time);
  fund.frequency.exponentialRampToValueAtTime(45, time + 0.08);
  fund.frequency.setTargetAtTime(42, time + 0.08, 0.1);
  const fundGain = ctx.createGain();
  fundGain.gain.setValueAtTime(1.0, time);
  fundGain.gain.setTargetAtTime(0.6, time + 0.05, 0.04);
  fundGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
  fund.connect(fundGain);
  fundGain.connect(dest);
  fundGain.connect(reverb);
  fund.start(time);
  fund.stop(time + 0.4);

  // Shell overtone (2nd harmonic for wood resonance)
  const ot = ctx.createOscillator();
  ot.type = 'sine';
  ot.frequency.setValueAtTime(180, time);
  ot.frequency.exponentialRampToValueAtTime(85, time + 0.06);
  const otGain = ctx.createGain();
  otGain.gain.setValueAtTime(0.35, time);
  otGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  ot.connect(otGain);
  otGain.connect(dest);
  ot.start(time);
  ot.stop(time + 0.25);

  // Body thump (sub)
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(55, time);
  sub.frequency.setTargetAtTime(38, time, 0.06);
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.5, time);
  subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  sub.connect(subGain);
  subGain.connect(dest);
  sub.start(time);
  sub.stop(time + 0.35);
}

// Acoustic Snare — 14x5.5" maple shell with snare wires
function playAcousticSnare(ctx: AudioContext, dest: GainNode, time: number) {
  const reverb = getDrumReverb(ctx, dest);

  // Shell body (fundamental tone)
  const body = ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(220, time);
  body.frequency.exponentialRampToValueAtTime(160, time + 0.03);
  body.frequency.setTargetAtTime(150, time + 0.03, 0.05);
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.6, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  body.connect(bodyGain);
  bodyGain.connect(dest);
  bodyGain.connect(reverb);
  body.start(time);
  body.stop(time + 0.2);

  // Shell overtone (ring)
  const ring = ctx.createOscillator();
  ring.type = 'sine';
  ring.frequency.setValueAtTime(340, time);
  ring.frequency.exponentialRampToValueAtTime(280, time + 0.04);
  const ringGain = ctx.createGain();
  ringGain.gain.setValueAtTime(0.15, time);
  ringGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  ring.connect(ringGain);
  ringGain.connect(dest);
  ring.start(time);
  ring.stop(time + 0.15);

  // Snare wires (shaped noise)
  const wires = ctx.createBufferSource();
  wires.buffer = createNoiseBuffer(ctx, 0.2);
  // Bandpass to simulate snare wire rattle
  const wiresBP = ctx.createBiquadFilter();
  wiresBP.type = 'bandpass';
  wiresBP.frequency.value = 4000;
  wiresBP.Q.value = 0.8;
  // High shelf for sizzle
  const wiresHS = ctx.createBiquadFilter();
  wiresHS.type = 'highshelf';
  wiresHS.frequency.value = 6000;
  wiresHS.gain.value = 3;
  const wiresGain = ctx.createGain();
  wiresGain.gain.setValueAtTime(0.45, time);
  wiresGain.gain.setTargetAtTime(0.25, time + 0.02, 0.02);
  wiresGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  wires.connect(wiresBP);
  wiresBP.connect(wiresHS);
  wiresHS.connect(wiresGain);
  wiresGain.connect(dest);
  wiresGain.connect(reverb);
  wires.start(time);

  // Stick attack transient
  const attack = ctx.createBufferSource();
  attack.buffer = createNoiseBuffer(ctx, 0.005);
  const attackHP = ctx.createBiquadFilter();
  attackHP.type = 'highpass';
  attackHP.frequency.value = 5000;
  const attackGain = ctx.createGain();
  attackGain.gain.setValueAtTime(0.8, time);
  attackGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
  attack.connect(attackHP);
  attackHP.connect(attackGain);
  attackGain.connect(dest);
  attack.start(time);
}

// Acoustic Hi-Hat — 14" bronze cymbals
function playAcousticHihat(ctx: AudioContext, dest: GainNode, time: number) {
  const reverb = getDrumReverb(ctx, dest);

  // Metallic fundamentals (multiple detuned oscillators for shimmer)
  const freqs = [320, 530, 785, 1150, 1680];
  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = f;
    const oscGain = ctx.createGain();
    const level = 0.06 / (idx + 1);
    oscGain.gain.setValueAtTime(level, time);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.08);
  });

  // Noise component (bronze sizzle)
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.08);
  // Highpass to cut mud
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 8000;
  hp.Q.value = 0.5;
  // Peak at cymbal frequency
  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = 10000;
  peak.Q.value = 2;
  peak.gain.value = 6;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.28, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.065);
  noise.connect(hp);
  hp.connect(peak);
  peak.connect(noiseGain);
  noiseGain.connect(dest);
  noiseGain.connect(reverb);
  noise.start(time);
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
      drumReverb = null;
      drumReverbGain = null;
    }
    gainRef.current!.gain.value = volume / 100;
    return audioCtxRef.current;
  }, [volume]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume / 100;
  }, [volume]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(-1);
    stepRef.current = 0;
    drumReverb = null;
    drumReverbGain = null;
  }, []);

  const play = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const pattern = DRUM_PATTERNS[selectedPattern];
    stepRef.current = 0;

    const stepDuration = (60 / bpm / 4) * 1000;

    intervalRef.current = window.setInterval(() => {
      const step = stepRef.current % pattern.steps;
      const time = ctx.currentTime;
      if (pattern.kick[step]) playAcousticKick(ctx, gainRef.current!, time);
      if (pattern.snare[step]) playAcousticSnare(ctx, gainRef.current!, time);
      if (pattern.hihat[step]) playAcousticHihat(ctx, gainRef.current!, time);
      setCurrentStep(step);
      stepRef.current++;
    }, stepDuration);

    setIsPlaying(true);
  }, [selectedPattern, bpm, getAudioContext]);

  const togglePlay = () => {
    if (isPlaying) stop();
    else play();
  };

  useEffect(() => {
    if (isPlaying) { stop(); }
    setBpm(DRUM_PATTERNS[selectedPattern].defaultBpm);
  }, [selectedPattern]);

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
