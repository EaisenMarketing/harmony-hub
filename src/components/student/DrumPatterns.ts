// Shared acoustic drum synthesis + rhythm patterns for chord loop accompaniment

export type DrumPatternId = 'off' | 'rock' | 'pop' | 'balada' | 'funk';

export const DRUM_PATTERN_LABELS: Record<DrumPatternId, string> = {
  off: '🔇 Sin ritmo',
  rock: '🤘 Rock',
  pop: '🎵 Pop',
  balada: '🌙 Balada',
  funk: '💃 Funk',
};

// 16 sixteenth-note steps per bar (4/4)
// 'k' = kick, 's' = snare, 'h' = hi-hat closed, 'H' = hi-hat open
type Step = { k?: boolean; s?: boolean; h?: boolean; H?: boolean };

const ROCK: Step[] = [
  { k: true, h: true }, { h: true }, { h: true }, { h: true },
  { s: true, h: true }, { h: true }, { k: true, h: true }, { h: true },
  { k: true, h: true }, { h: true }, { h: true }, { h: true },
  { s: true, h: true }, { h: true }, { h: true }, { h: true },
];

const POP: Step[] = [
  { k: true, h: true }, { h: true }, { h: true }, { h: true },
  { s: true, h: true }, { h: true }, { h: true }, { h: true },
  { k: true, h: true }, { h: true }, { k: true, h: true }, { h: true },
  { s: true, h: true }, { h: true }, { h: true }, { h: true },
];

const BALADA: Step[] = [
  { k: true, h: true }, {}, { h: true }, {},
  { s: true, h: true }, {}, { h: true }, {},
  { k: true, h: true }, {}, { h: true }, {},
  { s: true, h: true }, {}, { h: true }, {},
];

const FUNK: Step[] = [
  { k: true, h: true }, { h: true }, { h: true }, { k: true, h: true },
  { s: true, h: true }, { h: true }, { k: true, h: true }, { h: true },
  { h: true }, { k: true, h: true }, { h: true }, { h: true },
  { s: true, h: true }, { k: true, h: true }, { h: true }, { H: true },
];

const PATTERNS: Record<Exclude<DrumPatternId, 'off'>, Step[]> = {
  rock: ROCK,
  pop: POP,
  balada: BALADA,
  funk: FUNK,
};

// ───────── Acoustic drum synthesis ─────────

function playKick(ctx: AudioContext, dest: AudioNode, t: number, vol: number) {
  // Sub + body sweep
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.45);

  // Beater click
  const clickLen = Math.floor(ctx.sampleRate * 0.01);
  const clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
  const cd = clickBuf.getChannelData(0);
  for (let i = 0; i < clickLen; i++) {
    cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickLen * 0.2));
  }
  const click = ctx.createBufferSource();
  click.buffer = clickBuf;
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'highpass';
  clickFilter.frequency.value = 1500;
  const clickGain = ctx.createGain();
  clickGain.gain.value = vol * 0.3;
  click.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(dest);
  click.start(t);
}

function playSnare(ctx: AudioContext, dest: AudioNode, t: number, vol: number) {
  // Tonal body
  const tone = ctx.createOscillator();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(220, t);
  tone.frequency.exponentialRampToValueAtTime(180, t + 0.08);
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0, t);
  tg.gain.linearRampToValueAtTime(vol * 0.5, t + 0.003);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  tone.connect(tg);
  tg.connect(dest);
  tone.start(t);
  tone.stop(t + 0.2);

  // Snare wires (filtered noise)
  const noiseLen = Math.floor(ctx.sampleRate * 0.2);
  const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'highpass';
  bp.frequency.value = 1200;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(vol * 0.7, t + 0.002);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  noise.connect(bp);
  bp.connect(ng);
  ng.connect(dest);
  noise.start(t);
}

function playHiHat(ctx: AudioContext, dest: AudioNode, t: number, vol: number, open = false) {
  const dur = open ? 0.25 : 0.05;
  const noiseLen = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = 10000;
  peak.Q.value = 1;
  peak.gain.value = 4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol * (open ? 0.35 : 0.25), t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  noise.connect(hp);
  hp.connect(peak);
  peak.connect(g);
  g.connect(dest);
  noise.start(t);
}

export interface DrumBus {
  input: GainNode;
}

export function createDrumBus(ctx: AudioContext, destination: AudioNode): DrumBus {
  const input = ctx.createGain();
  input.gain.value = 0.6;
  // Light compression for glue
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-12, ctx.currentTime);
  comp.ratio.setValueAtTime(4, ctx.currentTime);
  comp.attack.setValueAtTime(0.003, ctx.currentTime);
  comp.release.setValueAtTime(0.1, ctx.currentTime);
  input.connect(comp);
  comp.connect(destination);
  return { input };
}

/**
 * Schedules one bar (16 sixteenth notes) of the chosen pattern at startTime.
 * `barDuration` = duration of a full 4/4 bar in seconds.
 */
export function scheduleDrumBar(
  ctx: AudioContext,
  bus: DrumBus,
  patternId: DrumPatternId,
  startTime: number,
  barDuration: number,
  volume = 0.7
) {
  if (patternId === 'off') return;
  const pattern = PATTERNS[patternId];
  if (!pattern) return;
  const stepDur = barDuration / 16;

  pattern.forEach((step, i) => {
    const t = startTime + i * stepDur;
    if (step.k) playKick(ctx, bus.input, t, volume);
    if (step.s) playSnare(ctx, bus.input, t, volume);
    if (step.h) playHiHat(ctx, bus.input, t, volume, false);
    if (step.H) playHiHat(ctx, bus.input, t, volume, true);
  });
}
