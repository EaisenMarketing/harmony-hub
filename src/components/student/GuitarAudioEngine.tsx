import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Square, SkipForward } from 'lucide-react';

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

// Chord voicings as arrays of note names
const CHORD_VOICINGS: Record<string, string[]> = {
  // Major
  'C':     ['C', 'E', 'G', 'C', 'E'],
  'D':     ['D', 'F#', 'A', 'D'],
  'E':     ['E', 'G#', 'B', 'E', 'G#'],
  'F':     ['F', 'A', 'C', 'F', 'A'],
  'G':     ['G', 'B', 'D', 'G', 'B'],
  'A':     ['A', 'C#', 'E', 'A', 'C#'],
  'B':     ['B', 'D#', 'F#', 'B'],
  'Bb':    ['Bb', 'D', 'F', 'Bb'],
  'Eb':    ['Eb', 'G', 'Bb', 'Eb'],
  'Ab':    ['Ab', 'C', 'Eb', 'Ab'],
  // Minor
  'Cm':    ['C', 'Eb', 'G', 'C', 'Eb'],
  'Dm':    ['D', 'F', 'A', 'D'],
  'Em':    ['E', 'G', 'B', 'E', 'G'],
  'Fm':    ['F', 'Ab', 'C', 'F'],
  'Gm':    ['G', 'Bb', 'D', 'G'],
  'Am':    ['A', 'C', 'E', 'A', 'C'],
  'Bm':    ['B', 'D', 'F#', 'B'],
  'Bbm':   ['Bb', 'Db', 'F', 'Bb'],
  // Dominant 7th
  'C7':    ['C', 'E', 'G', 'Bb'],
  'D7':    ['D', 'F#', 'A', 'C'],
  'E7':    ['E', 'G#', 'B', 'D'],
  'F7':    ['F', 'A', 'C', 'Eb'],
  'G7':    ['G', 'B', 'D', 'F'],
  'A7':    ['A', 'C#', 'E', 'G'],
  'B7':    ['B', 'D#', 'F#', 'A'],
  'Bb7':   ['Bb', 'D', 'F', 'Ab'],
  // Major 7th
  'Cmaj7': ['C', 'E', 'G', 'B'],
  'Dmaj7': ['D', 'F#', 'A', 'C#'],
  'Emaj7': ['E', 'G#', 'B', 'D#'],
  'Fmaj7': ['F', 'A', 'C', 'E'],
  'Gmaj7': ['G', 'B', 'D', 'F#'],
  'Amaj7': ['A', 'C#', 'E', 'G#'],
  'Bbmaj7':['Bb', 'D', 'F', 'A'],
  // Minor 7th
  'Cm7':   ['C', 'Eb', 'G', 'Bb'],
  'Dm7':   ['D', 'F', 'A', 'C'],
  'Em7':   ['E', 'G', 'B', 'D'],
  'Fm7':   ['F', 'Ab', 'C', 'Eb'],
  'Gm7':   ['G', 'Bb', 'D', 'F'],
  'Am7':   ['A', 'C', 'E', 'G'],
  'Bm7':   ['B', 'D', 'F#', 'A'],
  // Sus2
  'Csus2': ['C', 'D', 'G', 'C'],
  'Dsus2': ['D', 'E', 'A', 'D'],
  'Esus2': ['E', 'F#', 'B', 'E'],
  'Gsus2': ['G', 'A', 'D', 'G'],
  'Asus2': ['A', 'B', 'E', 'A'],
  // Sus4
  'Csus4': ['C', 'F', 'G', 'C'],
  'Dsus4': ['D', 'G', 'A', 'D'],
  'Esus4': ['E', 'A', 'B', 'E'],
  'Gsus4': ['G', 'C', 'D', 'G'],
  'Asus4': ['A', 'D', 'E', 'A'],
  // Add9
  'Cadd9': ['C', 'E', 'G', 'D'],
  'Dadd9': ['D', 'F#', 'A', 'E'],
  'Eadd9': ['E', 'G#', 'B', 'F#'],
  'Gadd9': ['G', 'B', 'D', 'A'],
  'Aadd9': ['A', 'C#', 'E', 'B'],
  // 9th chords
  'C9':    ['C', 'E', 'Bb', 'D'],
  'D9':    ['D', 'F#', 'C', 'E'],
  'G9':    ['G', 'B', 'F', 'A'],
  'A9':    ['A', 'C#', 'G', 'B'],
  // Minor 9th
  'Am9':   ['A', 'C', 'G', 'B'],
  'Dm9':   ['D', 'F', 'C', 'E'],
  'Em9':   ['E', 'G', 'D', 'F#'],
  // Diminished
  'Bdim':  ['B', 'D', 'F'],
  'Cdim':  ['C', 'Eb', 'Gb'],
  'Ddim':  ['D', 'F', 'Ab'],
  // Augmented
  'Caug':  ['C', 'E', 'G#'],
  'Eaug':  ['E', 'G#', 'C'],
  // Power chords
  'C5':    ['C', 'G', 'C'],
  'D5':    ['D', 'A', 'D'],
  'E5':    ['E', 'B', 'E'],
  'G5':    ['G', 'D', 'G'],
  'A5':    ['A', 'E', 'A'],
};

// Create convolution reverb impulse response
function createReverbIR(ctx: AudioContext, duration = 2.5, decay = 3.0): AudioBuffer {
  const length = ctx.sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

// Shared effects chain — created once per AudioContext
function createEffectsChain(ctx: AudioContext) {
  // Master gain
  const master = ctx.createGain();
  master.gain.value = 1.0;

  // Body resonance EQ
  const bodyEQ = ctx.createBiquadFilter();
  bodyEQ.type = 'peaking';
  bodyEQ.frequency.value = 250;
  bodyEQ.Q.value = 1.2;
  bodyEQ.gain.value = 4;

  // Presence EQ
  const presenceEQ = ctx.createBiquadFilter();
  presenceEQ.type = 'peaking';
  presenceEQ.frequency.value = 3500;
  presenceEQ.Q.value = 1.0;
  presenceEQ.gain.value = 2;

  // High-cut for warmth
  const highCut = ctx.createBiquadFilter();
  highCut.type = 'lowpass';
  highCut.frequency.value = 6000;
  highCut.Q.value = 0.7;

  // Chorus via modulated delay
  const chorusDelay = ctx.createDelay(0.05);
  chorusDelay.delayTime.value = 0.012;
  const chorusGain = ctx.createGain();
  chorusGain.gain.value = 0.3;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.8;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.003;
  lfo.connect(lfoGain);
  lfoGain.connect(chorusDelay.delayTime);
  lfo.start();

  // Convolution reverb
  const reverb = ctx.createConvolver();
  reverb.buffer = createReverbIR(ctx, 2.5, 3.0);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.25;
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.85;

  // Chain: input → bodyEQ → presenceEQ → highCut → master
  // master → dry → destination
  // master → chorus → destination
  // master → reverb → destination
  bodyEQ.connect(presenceEQ);
  presenceEQ.connect(highCut);
  highCut.connect(master);

  master.connect(dryGain);
  dryGain.connect(ctx.destination);

  master.connect(chorusDelay);
  chorusDelay.connect(chorusGain);
  chorusGain.connect(ctx.destination);

  master.connect(reverb);
  reverb.connect(reverbGain);
  reverbGain.connect(ctx.destination);

  return { input: bodyEQ, master };
}

// Karplus-Strong plucked string synthesis with improved realism
function pluckString(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  gain: number
) {
  const sampleRate = ctx.sampleRate;
  const N = Math.round(sampleRate / freq);
  const totalSamples = Math.round(sampleRate * duration);
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Shaped noise burst (low-pass filtered for warmer attack)
  const noise = new Float32Array(N);
  noise[0] = Math.random() * 2 - 1;
  for (let i = 1; i < N; i++) {
    noise[i] = 0.5 * (Math.random() * 2 - 1) + 0.5 * noise[i - 1];
  }

  // Karplus-Strong with two-point average + tuning allpass
  const decay = 0.998;
  const damping = 0.48;
  for (let i = 0; i < totalSamples; i++) {
    if (i < N) {
      data[i] = noise[i];
    } else {
      const s0 = data[i - N];
      const s1 = i - N + 1 < totalSamples ? data[i - N + 1] : s0;
      data[i] = decay * (damping * s0 + (1 - damping) * s1);
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  source.connect(gainNode);
  gainNode.connect(dest);

  source.start(startTime);
  source.stop(startTime + duration);
  return source;
}

let effectsChain: { input: AudioNode; master: GainNode } | null = null;

function strumChord(ctx: AudioContext, chordName: string, startTime: number, duration: number, volume: number) {
  const voicing = CHORD_VOICINGS[chordName];
  if (!voicing) return [];

  if (!effectsChain) {
    effectsChain = createEffectsChain(ctx);
  }

  const sources: AudioBufferSourceNode[] = [];
  const strumDelay = 0.018 + Math.random() * 0.008; // humanized strum

  voicing.forEach((noteName, i) => {
    const baseFreq = NOTE_FREQ[noteName];
    if (!baseFreq) return;
    const freq = i < 2 ? baseFreq : baseFreq * 2;
    const t = startTime + i * strumDelay;
    // Slight velocity variation per string
    const vel = volume * (0.3 + Math.random() * 0.1);
    const src = pluckString(ctx, effectsChain!.input, freq, t, duration - i * strumDelay, vel);
    sources.push(src);
  });

  return sources;
}

export const GuitarAudioEngine = ({ chords }: GuitarAudioEngineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [currentChordIdx, setCurrentChordIdx] = useState(-1);
  const ctxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<number[]>([]);
  const isPlayingRef = useRef(false);

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
    effectsChain = null;
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) {
      stop();
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    isPlayingRef.current = true;
    setIsPlaying(true);

    const beatDuration = 60 / bpm;
    const chordDuration = beatDuration * 2; // 2 beats per chord

    const playLoop = (loopStart: number) => {
      if (!isPlayingRef.current) return;

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

      // Schedule next loop
      const loopDuration = chords.length * chordDuration;
      const nextLoopDelay = (loopStart + loopDuration - ctx.currentTime) * 1000;
      const loopTid = window.setTimeout(() => {
        if (isPlayingRef.current) {
          playLoop(loopStart + loopDuration);
        }
      }, nextLoopDelay);
      timeoutRef.current.push(loopTid);
    };

    playLoop(ctx.currentTime + 0.1);
  }, [chords, bpm, stop]);

  const playOnce = useCallback(() => {
    const ctx = new AudioContext();
    const beatDuration = 60 / bpm;
    const chordDuration = beatDuration * 2;

    chords.forEach((chord, i) => {
      const time = ctx.currentTime + 0.1 + i * chordDuration;
      const delay = (time - ctx.currentTime) * 1000;
      setTimeout(() => {
        setCurrentChordIdx(i);
        strumChord(ctx, chord, ctx.currentTime, chordDuration * 0.9, 0.8);
      }, delay);
    });

    setTimeout(() => {
      setCurrentChordIdx(-1);
      ctx.close();
    }, (0.1 + chords.length * chordDuration) * 1000 + 500);
  }, [chords, bpm]);

  return (
    <div className="space-y-3">
      {/* Chord visualization with highlight */}
      <div className="flex gap-2 flex-wrap items-center">
        {chords.map((chord, i) => (
          <div
            key={i}
            className={`rounded-xl px-5 py-3 text-center min-w-[70px] transition-all duration-200 ${
              currentChordIdx === i
                ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <p className="text-xl font-bold">{chord}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          size="sm"
          variant={isPlaying ? 'destructive' : 'default'}
          onClick={play}
          className="gap-2"
        >
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Detener' : 'Loop'}
        </Button>
        <Button size="sm" variant="outline" onClick={playOnce} className="gap-2" disabled={isPlaying}>
          <SkipForward className="w-4 h-4" /> Una vez
        </Button>
        <div className="flex items-center gap-2 min-w-[160px]">
          <span className="text-xs text-muted-foreground font-mono w-12">{bpm} BPM</span>
          <Slider
            value={[bpm]}
            onValueChange={([v]) => setBpm(v)}
            min={40}
            max={160}
            step={5}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};
