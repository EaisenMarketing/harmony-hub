// Modelo musical de Acorde Live — fuente única de verdad del creador de partituras.

export type ScoreInstrument = 'guitar' | 'electric_guitar' | 'bass' | 'piano' | 'trumpet' | 'drums';

export type NoteDuration = 'w' | 'h' | 'q' | '8' | '16';

export interface ScoreNote {
  /** Claves VexFlow: ["c/4", "e/4"]. Para batería son posiciones de la clave percusiva. */
  keys: string[];
  duration: NoteDuration;
  dotted?: boolean;
  rest?: boolean;
  /** Digitación en tablatura (cuerda 1 = más aguda). */
  tab?: { str: number; fret: number }[];
  /** Piezas de batería (kick, snare...). */
  drums?: DrumPiece[];
  /** Acorde escrito arriba del compás. */
  chord?: string;
}

export interface ScoreMeasure {
  notes: ScoreNote[];
}

export interface ScoreContent {
  measures: ScoreMeasure[];
}

export interface ScoreDoc {
  id?: string;
  title: string;
  instrument: ScoreInstrument;
  key_signature: string;
  time_signature: string;
  tempo: number;
  level?: string | null;
  description?: string | null;
  content: ScoreContent;
  is_public?: boolean;
  share_code?: string;
}

export const DURATION_BEATS: Record<NoteDuration, number> = {
  w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25,
};

export const DURATION_LABEL: Record<NoteDuration, string> = {
  w: 'Redonda', h: 'Blanca', q: 'Negra', '8': 'Corchea', '16': 'Semicorchea',
};

export function noteBeats(n: ScoreNote): number {
  const base = DURATION_BEATS[n.duration];
  return n.dotted ? base * 1.5 : base;
}

export function measureBeats(m: ScoreMeasure): number {
  return m.notes.reduce((s, n) => s + noteBeats(n), 0);
}

export function beatsPerMeasure(timeSignature: string): number {
  const [num, den] = timeSignature.split('/').map(Number);
  if (!num || !den) return 4;
  return num * (4 / den);
}

// ---------------------------------------------------------------- pitch utils

const SHARP_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const FLAT_TO_SHARP: Record<string, string> = {
  db: 'c#', eb: 'd#', gb: 'f#', ab: 'g#', bb: 'a#', cb: 'b', fb: 'e',
};

/** "c#/4" -> midi 61 */
export function keyToMidi(key: string): number {
  const [rawName, rawOct] = key.split('/');
  let name = rawName.toLowerCase().replace('n', '');
  if (FLAT_TO_SHARP[name]) name = FLAT_TO_SHARP[name];
  let oct = parseInt(rawOct, 10);
  if (rawName.toLowerCase() === 'cb') oct -= 1;
  const idx = SHARP_NAMES.indexOf(name);
  if (idx < 0) return 60;
  return (oct + 1) * 12 + idx;
}

/** midi 61 -> "c#/4" */
export function midiToKey(midi: number): string {
  const idx = ((midi % 12) + 12) % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${SHARP_NAMES[idx]}/${oct}`;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

export function keyLabel(key: string): string {
  const [n, o] = key.split('/');
  return `${n.toUpperCase().replace('#', '♯')}${o}`;
}

// ------------------------------------------------------------- instrument cfg

export interface InstrumentScoreConfig {
  label: string;
  emoji: string;
  clef: 'treble' | 'bass' | 'percussion';
  /** Afinación de la tablatura, de la cuerda más aguda a la más grave. */
  tuning?: number[];
  stringLabels?: string[];
  grandStaff?: boolean;
  isDrums?: boolean;
  /** Rango cómodo (midi) para el paleta de notas. */
  range: [number, number];
  timbre: 'pluck' | 'piano' | 'brass' | 'drums';
}

export const SCORE_INSTRUMENTS: Record<ScoreInstrument, InstrumentScoreConfig> = {
  guitar: {
    label: 'Guitarra acústica', emoji: '🎸', clef: 'treble',
    tuning: [64, 59, 55, 50, 45, 40], stringLabels: ['E', 'B', 'G', 'D', 'A', 'E'],
    range: [40, 76], timbre: 'pluck',
  },
  electric_guitar: {
    label: 'Guitarra eléctrica', emoji: '🎸', clef: 'treble',
    tuning: [64, 59, 55, 50, 45, 40], stringLabels: ['E', 'B', 'G', 'D', 'A', 'E'],
    range: [40, 81], timbre: 'pluck',
  },
  bass: {
    label: 'Bajo', emoji: '🎸', clef: 'bass',
    tuning: [43, 38, 33, 28], stringLabels: ['G', 'D', 'A', 'E'],
    range: [28, 60], timbre: 'pluck',
  },
  piano: {
    label: 'Piano', emoji: '🎹', clef: 'treble', grandStaff: true,
    range: [36, 84], timbre: 'piano',
  },
  trumpet: {
    label: 'Trompeta', emoji: '🎺', clef: 'treble',
    range: [55, 82], timbre: 'brass',
  },
  drums: {
    label: 'Batería', emoji: '🥁', clef: 'percussion', isDrums: true,
    range: [36, 60], timbre: 'drums',
  },
};

// ------------------------------------------------------------------- drums

export type DrumPiece = 'kick' | 'snare' | 'hihat' | 'openhat' | 'crash' | 'ride' | 'tom1' | 'tom2' | 'floor';

export interface DrumPieceInfo {
  key: string;          // posición en la clave percusiva
  label: string;
  midi: number;         // nota General MIDI
  notehead?: 'x' | 'normal';
}

export const DRUM_MAP: Record<DrumPiece, DrumPieceInfo> = {
  kick:    { key: 'f/4', label: 'Bombo',        midi: 36 },
  snare:   { key: 'c/5', label: 'Redoblante',   midi: 38 },
  floor:   { key: 'e/4', label: 'Tom de piso',  midi: 41 },
  tom2:    { key: 'd/5', label: 'Tom medio',    midi: 45 },
  tom1:    { key: 'e/5', label: 'Tom alto',     midi: 48 },
  hihat:   { key: 'g/5', label: 'Hi-hat',       midi: 42, notehead: 'x' },
  openhat: { key: 'g/5', label: 'Hi-hat abierto', midi: 46, notehead: 'x' },
  ride:    { key: 'f/5', label: 'Ride',         midi: 51, notehead: 'x' },
  crash:   { key: 'a/5', label: 'Crash',        midi: 49, notehead: 'x' },
};

export const DRUM_ORDER: DrumPiece[] = ['crash', 'hihat', 'openhat', 'ride', 'tom1', 'tom2', 'floor', 'snare', 'kick'];

// -------------------------------------------------------------- fingering

/** Elige la digitación más cómoda para una nota en un instrumento con trastes. */
export function autoTab(midi: number, tuning: number[], maxFret = 17): { str: number; fret: number } | null {
  let best: { str: number; fret: number } | null = null;
  tuning.forEach((open, i) => {
    const fret = midi - open;
    if (fret < 0 || fret > maxFret) return;
    const str = i + 1;
    if (!best || fret < best.fret) best = { str, fret };
  });
  return best;
}

export function autoTabChord(midis: number[], tuning: number[]): { str: number; fret: number }[] {
  const used = new Set<number>();
  const out: { str: number; fret: number }[] = [];
  [...midis].sort((a, b) => a - b).forEach((m) => {
    let picked: { str: number; fret: number } | null = null;
    for (let i = tuning.length - 1; i >= 0; i--) {
      const str = i + 1;
      if (used.has(str)) continue;
      const fret = m - tuning[i];
      if (fret < 0 || fret > 17) continue;
      if (!picked || fret < picked.fret) picked = { str, fret };
    }
    if (picked) { used.add(picked.str); out.push(picked); }
  });
  return out.length ? out : [];
}

export function emptyMeasure(): ScoreMeasure {
  return { notes: [] };
}

export function newScore(instrument: ScoreInstrument): ScoreDoc {
  return {
    title: `Nueva partitura de ${SCORE_INSTRUMENTS[instrument].label}`,
    instrument,
    key_signature: 'C',
    time_signature: '4/4',
    tempo: 90,
    content: { measures: [emptyMeasure(), emptyMeasure(), emptyMeasure(), emptyMeasure()] },
  };
}

export const KEY_SIGNATURES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Am', 'Em', 'Bm', 'Dm', 'Gm', 'Cm'];
export const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '6/8', '12/8', '5/4'];
