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
  'C':     ['C', 'E', 'G', 'C', 'E'],
  'Cm':    ['C', 'Eb', 'G', 'C', 'Eb'],
  'C7':    ['C', 'E', 'G', 'Bb'],
  'Cmaj7': ['C', 'E', 'G', 'B'],
  'D':     ['D', 'F#', 'A', 'D'],
  'Dm':    ['D', 'F', 'A', 'D'],
  'Dm7':   ['D', 'F', 'A', 'C'],
  'E':     ['E', 'G#', 'B', 'E', 'G#'],
  'Em':    ['E', 'G', 'B', 'E', 'G'],
  'F':     ['F', 'A', 'C', 'F', 'A'],
  'Fm':    ['F', 'Ab', 'C', 'F'],
  'G':     ['G', 'B', 'D', 'G', 'B'],
  'G7':    ['G', 'B', 'D', 'F'],
  'A':     ['A', 'C#', 'E', 'A', 'C#'],
  'Am':    ['A', 'C', 'E', 'A', 'C'],
  'Am7':   ['A', 'C', 'E', 'G'],
  'B':     ['B', 'D#', 'F#', 'B'],
  'Bm':    ['B', 'D', 'F#', 'B'],
  'Bb':    ['Bb', 'D', 'F', 'Bb'],
};

// Karplus-Strong plucked string synthesis
function pluckString(ctx: AudioContext, freq: number, startTime: number, duration: number, gain: number) {
  const sampleRate = ctx.sampleRate;
  const N = Math.round(sampleRate / freq);
  const totalSamples = Math.round(sampleRate * duration);
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Initialize with noise burst
  const noise = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    noise[i] = Math.random() * 2 - 1;
  }

  // Karplus-Strong with decay
  const decay = 0.996;
  const damping = 0.5;
  for (let i = 0; i < totalSamples; i++) {
    if (i < N) {
      data[i] = noise[i];
    } else {
      data[i] = decay * (damping * data[i - N] + (1 - damping) * data[i - N + 1 >= totalSamples ? i - N : i - N + 1]);
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Shape the amplitude
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  // Add subtle reverb-like effect with delay
  const delay = ctx.createDelay(0.5);
  delay.delayTime.value = 0.03;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.15;

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  gainNode.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  feedback.connect(ctx.destination);

  source.start(startTime);
  source.stop(startTime + duration);
  return source;
}

function strumChord(ctx: AudioContext, chordName: string, startTime: number, duration: number, volume: number) {
  const voicing = CHORD_VOICINGS[chordName];
  if (!voicing) return [];

  const sources: AudioBufferSourceNode[] = [];
  const strumDelay = 0.025; // delay between strings

  voicing.forEach((noteName, i) => {
    const baseFreq = NOTE_FREQ[noteName];
    if (!baseFreq) return;
    // Spread across octave 3-4 range
    const freq = i < 2 ? baseFreq : baseFreq * 2;
    const t = startTime + i * strumDelay;
    const src = pluckString(ctx, freq, t, duration - i * strumDelay, volume * 0.35);
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
