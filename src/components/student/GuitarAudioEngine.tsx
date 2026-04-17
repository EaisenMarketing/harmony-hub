import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Square, SkipForward, SlidersHorizontal, Drum } from 'lucide-react';
import { createDrumBus, scheduleDrumBar, DrumPatternId, DRUM_PATTERN_LABELS, DrumBus } from './DrumPatterns';

interface GuitarAudioEngineProps {
  chords: string[];
}

// Note frequencies (octave 3 and 4 for guitar range)
const NOTE_FREQ: Record<string, number> = {
  'C': 130.81, 'C#': 138.59, 'Db': 138.59,
  'D': 146.83, 'D#': 155.56, 'Eb': 155.56,
  'E': 164.81, 'F': 174.61, 'F#': 185.00, 'Gb': 185.00,
  'G': 196.00, 'G#': 207.65, 'Ab': 207.65,
  'A': 220.00, 'A#': 233.08, 'Bb': 233.08,
  'B': 246.94,
};

// Chord voicings — 6-string guitar voicings for Taylor-like open sound
const CHORD_VOICINGS: Record<string, string[]> = {
  // Major (open voicings with doubled notes like real guitar)
  'C':     ['C', 'E', 'G', 'C', 'E', 'G'],
  'D':     ['D', 'A', 'D', 'F#', 'A', 'D'],
  'E':     ['E', 'B', 'E', 'G#', 'B', 'E'],
  'F':     ['F', 'C', 'F', 'A', 'C', 'F'],
  'G':     ['G', 'B', 'D', 'G', 'B', 'G'],
  'A':     ['A', 'E', 'A', 'C#', 'E', 'A'],
  'B':     ['B', 'F#', 'B', 'D#', 'F#', 'B'],
  'Bb':    ['Bb', 'F', 'Bb', 'D', 'F', 'Bb'],
  'Eb':    ['Eb', 'Bb', 'Eb', 'G', 'Bb', 'Eb'],
  'Ab':    ['Ab', 'Eb', 'Ab', 'C', 'Eb', 'Ab'],
  // Minor
  'Cm':    ['C', 'G', 'C', 'Eb', 'G', 'C'],
  'Dm':    ['D', 'A', 'D', 'F', 'A', 'D'],
  'Em':    ['E', 'B', 'E', 'G', 'B', 'E'],
  'Fm':    ['F', 'C', 'F', 'Ab', 'C', 'F'],
  'Gm':    ['G', 'D', 'G', 'Bb', 'D', 'G'],
  'Am':    ['A', 'E', 'A', 'C', 'E', 'A'],
  'Bm':    ['B', 'F#', 'B', 'D', 'F#', 'B'],
  'Bbm':   ['Bb', 'F', 'Bb', 'Db', 'F', 'Bb'],
  // Dominant 7th
  'C7':    ['C', 'E', 'Bb', 'C', 'E', 'G'],
  'D7':    ['D', 'A', 'C', 'F#', 'A', 'D'],
  'E7':    ['E', 'B', 'D', 'G#', 'B', 'E'],
  'F7':    ['F', 'A', 'Eb', 'F', 'A', 'C'],
  'G7':    ['G', 'B', 'D', 'F', 'B', 'G'],
  'A7':    ['A', 'E', 'G', 'C#', 'E', 'A'],
  'B7':    ['B', 'F#', 'A', 'D#', 'F#', 'B'],
  'Bb7':   ['Bb', 'D', 'Ab', 'Bb', 'D', 'F'],
  // Major 7th
  'Cmaj7': ['C', 'E', 'G', 'B', 'E', 'G'],
  'Dmaj7': ['D', 'A', 'C#', 'F#', 'A', 'D'],
  'Emaj7': ['E', 'B', 'D#', 'G#', 'B', 'E'],
  'Fmaj7': ['F', 'A', 'C', 'E', 'A', 'C'],
  'Gmaj7': ['G', 'B', 'D', 'F#', 'B', 'G'],
  'Amaj7': ['A', 'E', 'G#', 'C#', 'E', 'A'],
  'Bbmaj7':['Bb', 'D', 'F', 'A', 'D', 'F'],
  // Minor 7th
  'Cm7':   ['C', 'G', 'Bb', 'Eb', 'G', 'C'],
  'Dm7':   ['D', 'A', 'C', 'F', 'A', 'D'],
  'Em7':   ['E', 'B', 'D', 'G', 'B', 'E'],
  'Fm7':   ['F', 'Ab', 'Eb', 'F', 'Ab', 'C'],
  'Gm7':   ['G', 'D', 'F', 'Bb', 'D', 'G'],
  'Am7':   ['A', 'E', 'G', 'C', 'E', 'A'],
  'Bm7':   ['B', 'F#', 'A', 'D', 'F#', 'B'],
  // Sus2
  'Csus2': ['C', 'G', 'C', 'D', 'G', 'C'],
  'Dsus2': ['D', 'A', 'D', 'E', 'A', 'D'],
  'Esus2': ['E', 'B', 'E', 'F#', 'B', 'E'],
  'Gsus2': ['G', 'D', 'G', 'A', 'D', 'G'],
  'Asus2': ['A', 'E', 'A', 'B', 'E', 'A'],
  // Sus4
  'Csus4': ['C', 'G', 'C', 'F', 'G', 'C'],
  'Dsus4': ['D', 'A', 'D', 'G', 'A', 'D'],
  'Esus4': ['E', 'B', 'E', 'A', 'B', 'E'],
  'Gsus4': ['G', 'D', 'G', 'C', 'D', 'G'],
  'Asus4': ['A', 'E', 'A', 'D', 'E', 'A'],
  // Add9
  'Cadd9': ['C', 'E', 'G', 'D', 'E', 'G'],
  'Dadd9': ['D', 'A', 'D', 'F#', 'A', 'E'],
  'Eadd9': ['E', 'B', 'E', 'G#', 'B', 'F#'],
  'Gadd9': ['G', 'B', 'D', 'A', 'B', 'G'],
  'Aadd9': ['A', 'E', 'A', 'C#', 'E', 'B'],
  // 9th
  'C9':    ['C', 'E', 'Bb', 'D', 'E', 'G'],
  'D9':    ['D', 'F#', 'C', 'E', 'A', 'D'],
  'G9':    ['G', 'B', 'F', 'A', 'B', 'G'],
  'A9':    ['A', 'C#', 'G', 'B', 'E', 'A'],
  // Minor 9th
  'Am9':   ['A', 'E', 'G', 'C', 'E', 'B'],
  'Dm9':   ['D', 'F', 'C', 'E', 'A', 'D'],
  'Em9':   ['E', 'G', 'D', 'F#', 'B', 'E'],
  // Diminished
  'Bdim':  ['B', 'F', 'B', 'D', 'F'],
  'Cdim':  ['C', 'Gb', 'C', 'Eb', 'Gb'],
  'Ddim':  ['D', 'Ab', 'D', 'F', 'Ab'],
  // Augmented
  'Caug':  ['C', 'E', 'G#', 'C', 'E'],
  'Eaug':  ['E', 'G#', 'C', 'E', 'G#'],
  // Power chords
  'C5':    ['C', 'G', 'C', 'G', 'C'],
  'D5':    ['D', 'A', 'D', 'A', 'D'],
  'E5':    ['E', 'B', 'E', 'B', 'E'],
  'G5':    ['G', 'D', 'G', 'D', 'G'],
  'A5':    ['A', 'E', 'A', 'E', 'A'],
};

// ─── Taylor-style acoustic guitar synthesis ───

interface EffectsNodes {
  input: BiquadFilterNode;
  master: GainNode;
  dryGain: GainNode;
  reverbGain: GainNode;
  chorusGain: GainNode;
  bodyEQ: BiquadFilterNode;
  presenceEQ: BiquadFilterNode;
  highCut: BiquadFilterNode;
  lfo: OscillatorNode;
}

// Taylor-specific body impulse response — simulates spruce top / rosewood back
function createTaylorBodyIR(ctx: AudioContext): AudioBuffer {
  const duration = 3.0;
  const length = Math.round(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      // Early reflections inside the body
      const early = t < 0.015 ? Math.exp(-t / 0.004) * 0.6 : 0;
      // Main body resonance decay
      const body = Math.exp(-t / 0.8) * 0.25;
      // Late diffuse tail (room)
      const room = Math.exp(-t / 1.5) * 0.08;
      d[i] = (Math.random() * 2 - 1) * (early + body + room);
    }
  }
  return impulse;
}

function createEffectsChain(ctx: AudioContext): EffectsNodes {
  const master = ctx.createGain();
  master.gain.value = 0.45; // Reduced to prevent clipping with 6 summed strings

  // Limiter — prevents harsh digital distortion
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-6, ctx.currentTime);
  limiter.knee.setValueAtTime(6, ctx.currentTime);
  limiter.ratio.setValueAtTime(12, ctx.currentTime);
  limiter.attack.setValueAtTime(0.001, ctx.currentTime);
  limiter.release.setValueAtTime(0.1, ctx.currentTime);

  // Taylor EQ curve: warm low-mids, sparkling highs
  const bodyEQ = ctx.createBiquadFilter();
  bodyEQ.type = 'peaking';
  bodyEQ.frequency.value = 220;
  bodyEQ.Q.value = 1.0;
  bodyEQ.gain.value = 3; // Reduced from 5

  const presenceEQ = ctx.createBiquadFilter();
  presenceEQ.type = 'peaking';
  presenceEQ.frequency.value = 3200;
  presenceEQ.Q.value = 0.8;
  presenceEQ.gain.value = 2; // Reduced from 3

  const highCut = ctx.createBiquadFilter();
  highCut.type = 'lowpass';
  highCut.frequency.value = 8000;
  highCut.Q.value = 0.5;

  const warmth = ctx.createBiquadFilter();
  warmth.type = 'lowshelf';
  warmth.frequency.value = 180;
  warmth.gain.value = 2; // Reduced from 3

  // Subtle chorus for stereo width
  const chorusDelay = ctx.createDelay(0.05);
  chorusDelay.delayTime.value = 0.015;
  const chorusGain = ctx.createGain();
  chorusGain.gain.value = 0.1; // Reduced from 0.15
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.4;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.002;
  lfo.connect(lfoGain);
  lfoGain.connect(chorusDelay.delayTime);
  lfo.start();

  // Taylor body reverb
  const reverb = ctx.createConvolver();
  reverb.buffer = createTaylorBodyIR(ctx);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.2; // Reduced from 0.3
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.7; // Reduced from 0.8

  // Signal chain — everything goes through limiter before destination
  warmth.connect(bodyEQ);
  bodyEQ.connect(presenceEQ);
  presenceEQ.connect(highCut);
  highCut.connect(master);

  master.connect(dryGain);
  dryGain.connect(limiter);

  master.connect(chorusDelay);
  chorusDelay.connect(chorusGain);
  chorusGain.connect(limiter);

  master.connect(reverb);
  reverb.connect(reverbGain);
  reverbGain.connect(limiter);

  limiter.connect(ctx.destination);

  return { input: warmth, master, dryGain, reverbGain, chorusGain, bodyEQ, presenceEQ, highCut, lfo };
}

// Clean Karplus-Strong acoustic guitar synthesis
function pluckString(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  gain: number,
  stringIndex: number // 0=low E to 5=high E
) {
  const sampleRate = ctx.sampleRate;
  const N = Math.max(2, Math.round(sampleRate / freq));
  const totalSamples = Math.round(sampleRate * duration);
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Soft noise excitation, lowpassed for warmth (no harsh harmonics)
  let prev = 0;
  for (let i = 0; i < N; i++) {
    const noise = Math.random() * 2 - 1;
    // One-pole lowpass on the noise burst — softer pluck
    prev = prev * 0.5 + noise * 0.5;
    // Smooth bell window so the burst has no clicks
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
    data[i] = prev * window;
  }

  // String-specific damping. Higher strings decay faster; all strictly < 1.
  // damping is the lowpass coefficient inside the loop (0..0.5 range of avg).
  const decay = 0.994 - stringIndex * 0.0015; // 0.994 .. 0.9865 — always stable
  const brightness = 0.5 + stringIndex * 0.02; // slight tilt per string

  // Standard Karplus-Strong: y[n] = decay * 0.5 * (y[n-N] + y[n-N-1])
  for (let i = N; i < totalSamples; i++) {
    const a = data[i - N];
    const b = data[i - N - 1] !== undefined ? data[i - N - 1] : a;
    const avg = brightness * a + (1 - brightness) * b;
    data[i] = decay * avg;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  // Smooth attack ramp avoids clicks
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  source.connect(gainNode);
  gainNode.connect(dest);

  source.start(startTime);
  source.stop(startTime + duration + 0.05);
  return source;
}

let fxNodes: EffectsNodes | null = null;

function strumChord(ctx: AudioContext, chordName: string, startTime: number, duration: number, volume: number) {
  const voicing = CHORD_VOICINGS[chordName];
  if (!voicing) return [];

  if (!fxNodes) {
    fxNodes = createEffectsChain(ctx);
  }

  const sources: AudioBufferSourceNode[] = [];
  const baseDelay = 0.018; // slower, more natural strum

  voicing.forEach((noteName, i) => {
    const baseFreq = NOTE_FREQ[noteName];
    if (!baseFreq) return;

    // Realistic octave assignment for 6 strings
    let freq: number;
    if (i === 0) freq = baseFreq;
    else if (i === 1) freq = baseFreq;
    else if (i <= 3) freq = baseFreq * 2;
    else freq = baseFreq * 2;

    const strumDelay = baseDelay + i * 0.008;
    const t = startTime + strumDelay;

    // Lower per-string velocity to prevent buildup across loops
    const velCurve = 1 - Math.abs(i - 2.5) / 6;
    const vel = volume * (0.10 + velCurve * 0.05);

    const src = pluckString(ctx, fxNodes!.input, freq, t, duration, vel, i);
    sources.push(src);
  });

  return sources;
}

export const GuitarAudioEngine = ({ chords }: GuitarAudioEngineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [currentChordIdx, setCurrentChordIdx] = useState(-1);
  const [showFx, setShowFx] = useState(false);

  const [reverbLevel, setReverbLevel] = useState(30);
  const [chorusLevel, setChorusLevel] = useState(15);
  const [bodyLevel, setBodyLevel] = useState(55);
  const [presenceLevel, setPresenceLevel] = useState(50);
  const [brightnessLevel, setBrightnessLevel] = useState(55);

  const [drumPattern, setDrumPattern] = useState<DrumPatternId>('pop');
  const [drumVolume, setDrumVolume] = useState(60);

  const ctxRef = useRef<AudioContext | null>(null);
  const drumBusRef = useRef<DrumBus | null>(null);
  const timeoutRef = useRef<number[]>([]);
  const isPlayingRef = useRef(false);

  const applyFx = useCallback(() => {
    if (!fxNodes) return;
    fxNodes.reverbGain.gain.value = reverbLevel / 100 * 0.6;
    fxNodes.dryGain.gain.value = 1 - reverbLevel / 100 * 0.4;
    fxNodes.chorusGain.gain.value = chorusLevel / 100 * 0.35;
    fxNodes.bodyEQ.gain.value = (bodyLevel / 50 - 1) * 8;
    fxNodes.presenceEQ.gain.value = (presenceLevel / 50 - 1) * 6;
    fxNodes.highCut.frequency.value = 3000 + (brightnessLevel / 100) * 9000;
  }, [reverbLevel, chorusLevel, bodyLevel, presenceLevel, brightnessLevel]);

  const applyRef = useRef(applyFx);
  applyRef.current = applyFx;

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentChordIdx(-1);
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    drumBusRef.current = null;
    fxNodes = null;
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) { stop(); return; }

    fxNodes = null;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    drumBusRef.current = createDrumBus(ctx, ctx.destination);
    drumBusRef.current.input.gain.value = drumVolume / 100;
    isPlayingRef.current = true;
    setIsPlaying(true);

    const beatDuration = 60 / bpm;
    const chordDuration = beatDuration * 2;
    const barDuration = beatDuration * 4;

    const playLoop = (loopStart: number) => {
      if (!isPlayingRef.current) return;
      applyRef.current();

      chords.forEach((chord, i) => {
        const time = loopStart + i * chordDuration;
        const delay = (time - ctx.currentTime) * 1000;
        if (delay < 0) return;
        const tid = window.setTimeout(() => {
          if (!isPlayingRef.current) return;
          setCurrentChordIdx(i);
          strumChord(ctx, chord, ctx.currentTime, chordDuration * 0.9, 0.8);
        }, delay);
        timeoutRef.current.push(tid);
      });

      const loopDuration = chords.length * chordDuration;
      const numBars = Math.max(1, Math.ceil(loopDuration / barDuration));
      if (drumBusRef.current && drumPattern !== 'off') {
        for (let b = 0; b < numBars; b++) {
          scheduleDrumBar(ctx, drumBusRef.current, drumPattern, loopStart + b * barDuration, barDuration, 0.7);
        }
      }

      const nextLoopDelay = (loopStart + loopDuration - ctx.currentTime) * 1000;
      const loopTid = window.setTimeout(() => {
        if (isPlayingRef.current) playLoop(loopStart + loopDuration);
      }, nextLoopDelay);
      timeoutRef.current.push(loopTid);
    };

    playLoop(ctx.currentTime + 0.1);
  }, [chords, bpm, stop, drumPattern, drumVolume]);

  const playOnce = useCallback(() => {
    fxNodes = null;
    const ctx = new AudioContext();
    const drumBus = createDrumBus(ctx, ctx.destination);
    drumBus.input.gain.value = drumVolume / 100;
    const beatDuration = 60 / bpm;
    const chordDuration = beatDuration * 2;
    const barDuration = beatDuration * 4;
    const startAt = ctx.currentTime + 0.1;

    chords.forEach((chord, i) => {
      const time = startAt + i * chordDuration;
      const delay = (time - ctx.currentTime) * 1000;
      setTimeout(() => {
        applyRef.current();
        setCurrentChordIdx(i);
        strumChord(ctx, chord, ctx.currentTime, chordDuration * 0.9, 0.8);
      }, delay);
    });

    if (drumPattern !== 'off') {
      const totalDur = chords.length * chordDuration;
      const numBars = Math.max(1, Math.ceil(totalDur / barDuration));
      for (let b = 0; b < numBars; b++) {
        scheduleDrumBar(ctx, drumBus, drumPattern, startAt + b * barDuration, barDuration, 0.7);
      }
    }

    setTimeout(() => {
      setCurrentChordIdx(-1);
      ctx.close();
      fxNodes = null;
    }, (0.1 + chords.length * chordDuration) * 1000 + 500);
  }, [chords, bpm, drumPattern, drumVolume]);

  const handleFxChange = useCallback((setter: (v: number) => void) => {
    return ([v]: number[]) => {
      setter(v);
      setTimeout(() => applyRef.current(), 0);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        {chords.map((chord, i) => (
          <div key={i} className={`rounded-xl px-5 py-3 text-center min-w-[70px] transition-all duration-200 ${
            currentChordIdx === i
              ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30'
              : 'bg-primary/10 text-primary'
          }`}>
            <p className="text-xl font-bold">{chord}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button size="sm" variant={isPlaying ? 'destructive' : 'default'} onClick={play} className="gap-2">
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Detener' : 'Loop'}
        </Button>
        <Button size="sm" variant="outline" onClick={playOnce} className="gap-2" disabled={isPlaying}>
          <SkipForward className="w-4 h-4" /> Una vez
        </Button>
        <div className="flex items-center gap-2 min-w-[160px]">
          <span className="text-xs text-muted-foreground font-mono w-12">{bpm} BPM</span>
          <Slider value={[bpm]} onValueChange={([v]) => setBpm(v)} min={40} max={160} step={5} className="w-24" />
        </div>
        <Button size="sm" variant={showFx ? 'secondary' : 'outline'} onClick={() => setShowFx(!showFx)} className="gap-1.5 ml-auto">
          <SlidersHorizontal className="w-4 h-4" /> FX
        </Button>
      </div>

      {showFx && (
        <div className="bg-muted/40 rounded-xl p-4 border border-border/50 space-y-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">🎸 Sonido Taylor Acoustic</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <FxSlider label="🌊 Reverb (Room)" value={reverbLevel} onChange={handleFxChange(setReverbLevel)} />
            <FxSlider label="✨ Chorus (Shimmer)" value={chorusLevel} onChange={handleFxChange(setChorusLevel)} />
            <FxSlider label="🔊 Cuerpo (Body)" value={bodyLevel} onChange={handleFxChange(setBodyLevel)} />
            <FxSlider label="🔔 Presencia (Sparkle)" value={presenceLevel} onChange={handleFxChange(setPresenceLevel)} />
            <FxSlider label="☀️ Brillo (Warmth)" value={brightnessLevel} onChange={handleFxChange(setBrightnessLevel)} />
          </div>
        </div>
      )}
    </div>
  );
};

function FxSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number[]) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-[140px] shrink-0">{label}</span>
      <Slider value={[value]} onValueChange={onChange} min={0} max={100} step={1} className="flex-1 min-w-[80px]" />
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{value}</span>
    </div>
  );
}
