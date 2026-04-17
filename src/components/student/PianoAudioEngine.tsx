import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Square, SkipForward, SlidersHorizontal, Drum } from 'lucide-react';
import { createDrumBus, scheduleDrumBar, DrumPatternId, DRUM_PATTERN_LABELS, DrumBus } from './DrumPatterns';

interface PianoAudioEngineProps {
  chords: string[];
}

// Note → frequency (A4 = 440)
const NOTE_SEMI: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

function noteToFreq(note: string, octave = 4): number {
  const semi = NOTE_SEMI[note];
  if (semi === undefined) return 0;
  // MIDI: A4 = 69 = 440Hz. midi = (octave+1)*12 + semi
  const midi = (octave + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Chord voicings → list of [note, octave]
const PIANO_VOICINGS: Record<string, [string, number][]> = {
  // Major triads (root + 3rd + 5th, with bass octave)
  'C':     [['C',3],['C',4],['E',4],['G',4]],
  'D':     [['D',3],['D',4],['F#',4],['A',4]],
  'E':     [['E',3],['E',4],['G#',4],['B',4]],
  'F':     [['F',3],['F',4],['A',4],['C',5]],
  'G':     [['G',2],['G',3],['B',3],['D',4]],
  'A':     [['A',2],['A',3],['C#',4],['E',4]],
  'B':     [['B',2],['B',3],['D#',4],['F#',4]],
  'Bb':    [['Bb',2],['Bb',3],['D',4],['F',4]],
  'Eb':    [['Eb',3],['Eb',4],['G',4],['Bb',4]],
  'Ab':    [['Ab',2],['Ab',3],['C',4],['Eb',4]],
  // Minor
  'Cm':    [['C',3],['C',4],['Eb',4],['G',4]],
  'Dm':    [['D',3],['D',4],['F',4],['A',4]],
  'Em':    [['E',3],['E',4],['G',4],['B',4]],
  'Fm':    [['F',3],['F',4],['Ab',4],['C',5]],
  'Gm':    [['G',2],['G',3],['Bb',3],['D',4]],
  'Am':    [['A',2],['A',3],['C',4],['E',4]],
  'Bm':    [['B',2],['B',3],['D',4],['F#',4]],
  'Bbm':   [['Bb',2],['Bb',3],['Db',4],['F',4]],
  // Dominant 7th
  'C7':    [['C',3],['C',4],['E',4],['G',4],['Bb',4]],
  'D7':    [['D',3],['D',4],['F#',4],['A',4],['C',5]],
  'E7':    [['E',3],['E',4],['G#',4],['B',4],['D',5]],
  'F7':    [['F',3],['F',4],['A',4],['C',5],['Eb',5]],
  'G7':    [['G',2],['G',3],['B',3],['D',4],['F',4]],
  'A7':    [['A',2],['A',3],['C#',4],['E',4],['G',4]],
  'B7':    [['B',2],['B',3],['D#',4],['F#',4],['A',4]],
  'Bb7':   [['Bb',2],['Bb',3],['D',4],['F',4],['Ab',4]],
  // Major 7th
  'Cmaj7': [['C',3],['C',4],['E',4],['G',4],['B',4]],
  'Dmaj7': [['D',3],['D',4],['F#',4],['A',4],['C#',5]],
  'Emaj7': [['E',3],['E',4],['G#',4],['B',4],['D#',5]],
  'Fmaj7': [['F',3],['F',4],['A',4],['C',5],['E',5]],
  'Gmaj7': [['G',2],['G',3],['B',3],['D',4],['F#',4]],
  'Amaj7': [['A',2],['A',3],['C#',4],['E',4],['G#',4]],
  'Bbmaj7':[['Bb',2],['Bb',3],['D',4],['F',4],['A',4]],
  // Minor 7th
  'Cm7':   [['C',3],['C',4],['Eb',4],['G',4],['Bb',4]],
  'Dm7':   [['D',3],['D',4],['F',4],['A',4],['C',5]],
  'Em7':   [['E',3],['E',4],['G',4],['B',4],['D',5]],
  'Fm7':   [['F',3],['F',4],['Ab',4],['C',5],['Eb',5]],
  'Gm7':   [['G',2],['G',3],['Bb',3],['D',4],['F',4]],
  'Am7':   [['A',2],['A',3],['C',4],['E',4],['G',4]],
  'Bm7':   [['B',2],['B',3],['D',4],['F#',4],['A',4]],
  // Sus2 / Sus4
  'Csus2': [['C',3],['C',4],['D',4],['G',4]],
  'Dsus2': [['D',3],['D',4],['E',4],['A',4]],
  'Esus2': [['E',3],['E',4],['F#',4],['B',4]],
  'Gsus2': [['G',2],['G',3],['A',3],['D',4]],
  'Asus2': [['A',2],['A',3],['B',3],['E',4]],
  'Csus4': [['C',3],['C',4],['F',4],['G',4]],
  'Dsus4': [['D',3],['D',4],['G',4],['A',4]],
  'Esus4': [['E',3],['E',4],['A',4],['B',4]],
  'Gsus4': [['G',2],['G',3],['C',4],['D',4]],
  'Asus4': [['A',2],['A',3],['D',4],['E',4]],
  // Add9
  'Cadd9': [['C',3],['C',4],['E',4],['G',4],['D',5]],
  'Dadd9': [['D',3],['D',4],['F#',4],['A',4],['E',5]],
  'Eadd9': [['E',3],['E',4],['G#',4],['B',4],['F#',5]],
  'Gadd9': [['G',2],['G',3],['B',3],['D',4],['A',4]],
  'Aadd9': [['A',2],['A',3],['C#',4],['E',4],['B',4]],
  // Diminished / Augmented
  'Bdim':  [['B',2],['B',3],['D',4],['F',4]],
  'Cdim':  [['C',3],['C',4],['Eb',4],['Gb',4]],
  'Ddim':  [['D',3],['D',4],['F',4],['Ab',4]],
  'Caug':  [['C',3],['C',4],['E',4],['G#',4]],
  'Eaug':  [['E',3],['E',4],['G#',4],['C',5]],
};

interface PianoFx {
  input: GainNode;
  master: GainNode;
  dryGain: GainNode;
  reverbGain: GainNode;
  toneEQ: BiquadFilterNode;
  brillanceEQ: BiquadFilterNode;
}

// Concert hall reverb impulse — long, lush, piano-friendly
function createHallIR(ctx: AudioContext): AudioBuffer {
  const duration = 2.8;
  const length = Math.round(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      const early = t < 0.05 ? Math.exp(-t / 0.02) * 0.5 : 0;
      const tail = Math.exp(-t / 1.4) * 0.4;
      d[i] = (Math.random() * 2 - 1) * (early + tail);
    }
  }
  return impulse;
}

function createPianoFx(ctx: AudioContext): PianoFx {
  const input = ctx.createGain();
  input.gain.value = 1;

  const master = ctx.createGain();
  master.gain.value = 0.5;

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-6, ctx.currentTime);
  limiter.knee.setValueAtTime(8, ctx.currentTime);
  limiter.ratio.setValueAtTime(10, ctx.currentTime);
  limiter.attack.setValueAtTime(0.002, ctx.currentTime);
  limiter.release.setValueAtTime(0.15, ctx.currentTime);

  // EQ — warm low-mids around 250Hz, sparkle around 5kHz
  const toneEQ = ctx.createBiquadFilter();
  toneEQ.type = 'peaking';
  toneEQ.frequency.value = 260;
  toneEQ.Q.value = 1.0;
  toneEQ.gain.value = 2;

  const brillanceEQ = ctx.createBiquadFilter();
  brillanceEQ.type = 'peaking';
  brillanceEQ.frequency.value = 5000;
  brillanceEQ.Q.value = 0.7;
  brillanceEQ.gain.value = 2;

  const highCut = ctx.createBiquadFilter();
  highCut.type = 'lowpass';
  highCut.frequency.value = 9000;
  highCut.Q.value = 0.5;

  const reverb = ctx.createConvolver();
  reverb.buffer = createHallIR(ctx);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.25;
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.85;

  // Routing
  input.connect(toneEQ);
  toneEQ.connect(brillanceEQ);
  brillanceEQ.connect(highCut);
  highCut.connect(master);

  master.connect(dryGain);
  dryGain.connect(limiter);

  master.connect(reverb);
  reverb.connect(reverbGain);
  reverbGain.connect(limiter);

  limiter.connect(ctx.destination);

  return { input, master, dryGain, reverbGain, toneEQ, brillanceEQ };
}

// Grand piano note via additive synthesis with detuned harmonics + hammer noise
function playPianoNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  velocity: number
) {
  if (freq <= 0) return;

  const noteGain = ctx.createGain();
  noteGain.gain.setValueAtTime(0, startTime);
  // Sharp piano attack
  noteGain.gain.linearRampToValueAtTime(velocity, startTime + 0.005);
  // Two-stage decay: fast initial, slow sustain
  noteGain.gain.exponentialRampToValueAtTime(velocity * 0.35, startTime + 0.4);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  // Lowpass that closes over time (string damping)
  const damper = ctx.createBiquadFilter();
  damper.type = 'lowpass';
  damper.Q.value = 0.5;
  const cutoffStart = Math.min(freq * 12, 8000);
  const cutoffEnd = Math.min(freq * 4, 3000);
  damper.frequency.setValueAtTime(cutoffStart, startTime);
  damper.frequency.exponentialRampToValueAtTime(cutoffEnd, startTime + duration);

  // Harmonic series with realistic amplitudes for grand piano
  // Slight inharmonicity (stretched tuning) + detuned strings (3-string unison)
  const harmonics = [
    { mult: 1,    amp: 1.0,  detune: 0 },
    { mult: 2,    amp: 0.55, detune: 2 },
    { mult: 3,    amp: 0.32, detune: -3 },
    { mult: 4,    amp: 0.20, detune: 4 },
    { mult: 5,    amp: 0.14, detune: -2 },
    { mult: 6,    amp: 0.08, detune: 3 },
    { mult: 7,    amp: 0.05, detune: -4 },
  ];

  const oscillators: OscillatorNode[] = [];
  harmonics.forEach((h) => {
    // Three slightly detuned oscillators per harmonic = unison shimmer
    const detunes = [-h.detune, 0, h.detune];
    detunes.forEach((d) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      // Slight inharmonicity: higher partials slightly sharp (real piano string stiffness)
      const inharmonicity = 1 + 0.0004 * h.mult * h.mult;
      osc.frequency.value = freq * h.mult * inharmonicity;
      osc.detune.value = d;

      const partialGain = ctx.createGain();
      partialGain.gain.value = h.amp / 3; // divide by 3 unisons

      osc.connect(partialGain);
      partialGain.connect(damper);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
      oscillators.push(osc);
    });
  });

  // Hammer attack noise — very short felt strike
  const noiseLen = Math.floor(ctx.sampleRate * 0.02);
  const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.15));
  }
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = Math.min(freq * 4, 4000);
  noiseFilter.Q.value = 1.5;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = velocity * 0.08;

  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(damper);
  noiseSrc.start(startTime);

  damper.connect(noteGain);
  noteGain.connect(dest);
}

let pianoFx: PianoFx | null = null;

function playChord(ctx: AudioContext, chordName: string, startTime: number, duration: number, volume: number) {
  const voicing = PIANO_VOICINGS[chordName];
  if (!voicing) return;
  if (!pianoFx) pianoFx = createPianoFx(ctx);

  // Bass note slightly louder, top notes slightly softer (natural voicing)
  voicing.forEach(([note, octave], i) => {
    const freq = noteToFreq(note, octave);
    // Tiny stagger so it sounds played by hands, not robot
    const t = startTime + i * 0.004;
    const isBass = i === 0;
    const vel = volume * (isBass ? 0.28 : 0.20 - i * 0.01);
    playPianoNote(ctx, pianoFx!.input, freq, t, duration, Math.max(vel, 0.08));
  });
}

export const PianoAudioEngine = ({ chords }: PianoAudioEngineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [currentChordIdx, setCurrentChordIdx] = useState(-1);
  const [showFx, setShowFx] = useState(false);

  const [reverbLevel, setReverbLevel] = useState(35);
  const [toneLevel, setToneLevel] = useState(55);
  const [brillanceLevel, setBrillanceLevel] = useState(55);

  const [drumPattern, setDrumPattern] = useState<DrumPatternId>('pop');
  const [drumVolume, setDrumVolume] = useState(60);

  const ctxRef = useRef<AudioContext | null>(null);
  const drumBusRef = useRef<DrumBus | null>(null);
  const timeoutRef = useRef<number[]>([]);
  const isPlayingRef = useRef(false);

  const applyFx = useCallback(() => {
    if (!pianoFx) return;
    pianoFx.reverbGain.gain.value = (reverbLevel / 100) * 0.6;
    pianoFx.dryGain.gain.value = 1 - (reverbLevel / 100) * 0.3;
    pianoFx.toneEQ.gain.value = (toneLevel / 50 - 1) * 6;
    pianoFx.brillanceEQ.gain.value = (brillanceLevel / 50 - 1) * 6;
  }, [reverbLevel, toneLevel, brillanceLevel]);

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
    pianoFx = null;
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) { stop(); return; }
    pianoFx = null;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    isPlayingRef.current = true;
    setIsPlaying(true);

    const beatDuration = 60 / bpm;
    const chordDuration = beatDuration * 2;

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
          playChord(ctx, chord, ctx.currentTime, chordDuration * 0.95, 0.7);
        }, delay);
        timeoutRef.current.push(tid);
      });

      const loopDuration = chords.length * chordDuration;
      const nextLoopDelay = (loopStart + loopDuration - ctx.currentTime) * 1000;
      const loopTid = window.setTimeout(() => {
        if (isPlayingRef.current) playLoop(loopStart + loopDuration);
      }, nextLoopDelay);
      timeoutRef.current.push(loopTid);
    };

    playLoop(ctx.currentTime + 0.1);
  }, [chords, bpm, stop]);

  const playOnce = useCallback(() => {
    pianoFx = null;
    const ctx = new AudioContext();
    const beatDuration = 60 / bpm;
    const chordDuration = beatDuration * 2;

    chords.forEach((chord, i) => {
      const time = ctx.currentTime + 0.1 + i * chordDuration;
      const delay = (time - ctx.currentTime) * 1000;
      setTimeout(() => {
        applyRef.current();
        setCurrentChordIdx(i);
        playChord(ctx, chord, ctx.currentTime, chordDuration * 0.95, 0.7);
      }, delay);
    });

    setTimeout(() => {
      setCurrentChordIdx(-1);
      ctx.close();
      pianoFx = null;
    }, (0.1 + chords.length * chordDuration) * 1000 + 800);
  }, [chords, bpm]);

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
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">🎹 Sonido Grand Piano</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <FxSlider label="🌊 Reverb (Hall)" value={reverbLevel} onChange={handleFxChange(setReverbLevel)} />
            <FxSlider label="🔊 Cuerpo (Tone)" value={toneLevel} onChange={handleFxChange(setToneLevel)} />
            <FxSlider label="✨ Brillo (Sparkle)" value={brillanceLevel} onChange={handleFxChange(setBrillanceLevel)} />
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
