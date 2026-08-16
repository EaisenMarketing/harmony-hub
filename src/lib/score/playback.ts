import {
  DRUM_MAP, SCORE_INSTRUMENTS, keyToMidi, midiToFreq, noteBeats,
  type ScoreDoc, type ScoreNote,
} from './model';

export interface FlatEvent {
  measure: number;
  index: number;
  time: number;      // segundos desde el inicio
  duration: number;  // segundos
  midis: number[];
  drums: number[];
  rest: boolean;
}

export function flattenScore(doc: ScoreDoc, fromMeasure = 0): FlatEvent[] {
  const spb = 60 / Math.max(20, doc.tempo);
  const out: FlatEvent[] = [];
  let t = 0;
  doc.content.measures.forEach((m, mi) => {
    m.notes.forEach((n, ni) => {
      const dur = noteBeats(n) * spb;
      if (mi >= fromMeasure) {
        out.push({
          measure: mi,
          index: ni,
          time: t,
          duration: dur,
          midis: n.rest ? [] : n.keys.map(keyToMidi),
          drums: n.rest ? [] : (n.drums ?? []).map((d) => DRUM_MAP[d].midi),
          rest: !!n.rest,
        });
      }
      if (mi >= fromMeasure) t += dur;
    });
  });
  return out;
}

type Timbre = 'pluck' | 'piano' | 'brass' | 'drums';

function playTone(ctx: AudioContext, out: GainNode, freq: number, at: number, dur: number, timbre: Timbre) {
  const g = ctx.createGain();
  g.connect(out);
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();

  if (timbre === 'pluck') {
    osc.type = 'triangle'; osc2.type = 'sawtooth';
  } else if (timbre === 'piano') {
    osc.type = 'triangle'; osc2.type = 'sine';
  } else {
    osc.type = 'sawtooth'; osc2.type = 'square';
  }
  osc.frequency.value = freq;
  osc2.frequency.value = freq * 2.001;

  const g2 = ctx.createGain();
  g2.gain.value = timbre === 'brass' ? 0.18 : 0.08;
  osc2.connect(g2); g2.connect(g);
  osc.connect(g);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = timbre === 'brass' ? 3200 : 4800;

  const peak = 0.22;
  const attack = timbre === 'brass' ? 0.06 : 0.005;
  const release = timbre === 'pluck' ? Math.min(dur, 0.9) : 0.18;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(peak, at + attack);
  if (timbre === 'pluck') {
    g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.25, dur * 1.1));
  } else {
    g.gain.setValueAtTime(peak * 0.85, at + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur + release);
  }
  osc.start(at); osc2.start(at);
  const stopAt = at + dur + release + 0.4;
  osc.stop(stopAt); osc2.stop(stopAt);
}

function playDrum(ctx: AudioContext, out: GainNode, midi: number, at: number) {
  const g = ctx.createGain();
  g.connect(out);
  if (midi === 36) { // kick
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, at);
    o.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    g.gain.setValueAtTime(0.9, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
    o.connect(g); o.start(at); o.stop(at + 0.35);
    return;
  }
  const len = midi === 49 || midi === 46 || midi === 51 ? 0.6 : 0.18;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  if (midi === 38) { f.type = 'bandpass'; f.frequency.value = 1800; }
  else if (midi === 42) { f.type = 'highpass'; f.frequency.value = 7000; }
  else if (midi === 46) { f.type = 'highpass'; f.frequency.value = 5200; }
  else if (midi === 49 || midi === 51) { f.type = 'highpass'; f.frequency.value = 3800; }
  else { f.type = 'bandpass'; f.frequency.value = 320; }
  g.gain.setValueAtTime(midi === 38 ? 0.6 : 0.35, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + len);
  src.connect(f); f.connect(g); src.start(at);
}

function playClick(ctx: AudioContext, out: GainNode, at: number, strong: boolean) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = strong ? 1600 : 1100;
  g.gain.setValueAtTime(0.12, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  o.connect(g); g.connect(out); o.start(at); o.stop(at + 0.06);
}

export interface PlayHandle {
  stop: () => void;
}

export function playScore(
  doc: ScoreDoc,
  opts: {
    fromMeasure?: number;
    metronome?: boolean;
    onEvent?: (e: FlatEvent | null) => void;
    onEnd?: () => void;
  } = {},
): PlayHandle {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  const timbre = SCORE_INSTRUMENTS[doc.instrument].timbre;
  const events = flattenScore(doc, opts.fromMeasure ?? 0);
  const start = ctx.currentTime + 0.12;
  const timers: number[] = [];
  let stopped = false;

  events.forEach((e) => {
    const at = start + e.time;
    if (!e.rest) {
      if (timbre === 'drums') e.drums.forEach((m) => playDrum(ctx, master, m, at));
      else e.midis.forEach((m) => playTone(ctx, master, midiToFreq(m), at, e.duration * 0.95, timbre));
    }
    if (opts.onEvent) {
      timers.push(window.setTimeout(() => { if (!stopped) opts.onEvent?.(e); }, (at - ctx.currentTime) * 1000));
    }
  });

  const total = events.length ? events[events.length - 1].time + events[events.length - 1].duration : 0;

  if (opts.metronome) {
    const spb = 60 / Math.max(20, doc.tempo);
    const beatsBar = parseInt(doc.time_signature.split('/')[0], 10) || 4;
    for (let b = 0; b * spb < total; b++) {
      playClick(ctx, master, start + b * spb, b % beatsBar === 0);
    }
  }

  timers.push(window.setTimeout(() => {
    if (stopped) return;
    opts.onEvent?.(null);
    opts.onEnd?.();
    ctx.close().catch(() => undefined);
  }, (total + 0.6) * 1000));

  return {
    stop: () => {
      stopped = true;
      timers.forEach(clearTimeout);
      opts.onEvent?.(null);
      ctx.close().catch(() => undefined);
    },
  };
}

/** Vista previa de una nota o acorde al hacer clic. */
export function previewNote(doc: ScoreDoc, note: ScoreNote) {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const g = ctx.createGain();
  g.gain.value = 0.9;
  g.connect(ctx.destination);
  const timbre = SCORE_INSTRUMENTS[doc.instrument].timbre;
  const at = ctx.currentTime + 0.02;
  if (timbre === 'drums') (note.drums ?? []).forEach((d) => playDrum(ctx, g, DRUM_MAP[d].midi, at));
  else note.keys.forEach((k) => playTone(ctx, g, midiToFreq(keyToMidi(k)), at, 0.5, timbre));
  window.setTimeout(() => ctx.close().catch(() => undefined), 1600);
}
