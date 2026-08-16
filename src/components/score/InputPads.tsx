import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  DRUM_MAP, DRUM_ORDER, SCORE_INSTRUMENTS, keyLabel, keyToMidi, midiToKey,
  type DrumPiece, type ScoreInstrument,
} from '@/lib/score/model';

const LETTERS = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

function diatonicStep(key: string): number {
  const [name, oct] = key.split('/');
  return parseInt(oct, 10) * 7 + LETTERS.indexOf(name[0].toLowerCase());
}

function stepToKey(step: number, accidental: '' | '#' | 'b'): string {
  const oct = Math.floor(step / 7);
  const letter = LETTERS[((step % 7) + 7) % 7];
  return `${letter}${accidental}/${oct}`;
}

/** Pentagrama clicable: cada línea y espacio inserta la nota correspondiente. */
export const StaffPad = ({
  instrument, accidental, onPick,
}: {
  instrument: ScoreInstrument;
  accidental: '' | '#' | 'b';
  onPick: (key: string) => void;
}) => {
  const cfg = SCORE_INSTRUMENTS[instrument];
  const gap = 12;
  const topY = 40;
  const height = 200;
  const width = 640;

  const bottomRef = cfg.clef === 'bass' ? 'g/2' : 'e/4';
  const refStep = diatonicStep(bottomRef);
  const bottomY = topY + gap * 4;

  const steps = useMemo(() => {
    const lo = diatonicStep(midiToKey(cfg.range[0]));
    const hi = diatonicStep(midiToKey(cfg.range[1]));
    const out: number[] = [];
    for (let s = lo; s <= hi; s++) out.push(s);
    return out;
  }, [cfg.range]);

  const yFor = (step: number) => bottomY - (step - refStep) * (gap / 2);

  const slots = steps
    .map((s) => ({ step: s, y: yFor(s) }))
    .filter((s) => s.y > 6 && s.y < height - 6);

  const slotW = Math.min(34, (width - 60) / Math.max(1, slots.length));

  return (
    <div className="w-full overflow-x-auto rounded-xl p-2" style={{ background: 'hsl(var(--score-paper))' }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[560px] w-full h-auto">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={20} x2={width - 12} y1={topY + i * gap} y2={topY + i * gap}
            stroke="hsl(var(--score-ink))" strokeWidth={1} opacity={0.85} />
        ))}
        <text x={26} y={bottomY + 2} fontSize={11} fill="hsl(var(--score-ink))" opacity={0.5}>
          {cfg.clef === 'bass' ? 'F' : cfg.clef === 'percussion' ? '𝄥' : 'G'}
        </text>

        {slots.map((s, i) => {
          const x = 46 + i * slotW;
          const key = stepToKey(s.step, accidental);
          const isLine = Math.abs(((s.step - refStep) % 2)) === 0;
          const needsLedger = s.y < topY - 2 || s.y > bottomY + 2;
          return (
            <g key={s.step} className="cursor-pointer" onClick={() => onPick(key)}>
              <rect x={x - slotW / 2} y={6} width={slotW} height={height - 34} fill="transparent" />
              {needsLedger && isLine && (
                <line x1={x - 9} x2={x + 9} y1={s.y} y2={s.y} stroke="hsl(var(--score-ink))" strokeWidth={1} opacity={0.6} />
              )}
              <circle cx={x} cy={s.y} r={5.5} fill="hsl(var(--primary))" opacity={0.25} />
              <circle cx={x} cy={s.y} r={5.5} fill="hsl(var(--primary))" className="opacity-0 hover:opacity-100 transition-opacity" />
              <text x={x} y={height - 12} textAnchor="middle" fontSize={9} fill="hsl(var(--score-ink))" opacity={0.55}>
                {keyLabel(key)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/** Mástil clicable para guitarra / bajo. */
export const FretboardPad = ({
  instrument, frets = 12, onPick,
}: {
  instrument: ScoreInstrument;
  frets?: number;
  onPick: (payload: { key: string; tab: { str: number; fret: number } }) => void;
}) => {
  const cfg = SCORE_INSTRUMENTS[instrument];
  const tuning = cfg.tuning ?? [];
  return (
    <div className="w-full overflow-x-auto rounded-xl p-2" style={{ background: 'hsl(var(--score-paper))' }}>
      <div className="min-w-[620px]">
        <div className="grid" style={{ gridTemplateColumns: `36px repeat(${frets + 1}, minmax(0,1fr))` }}>
          <div />
          {Array.from({ length: frets + 1 }, (_, f) => (
            <div key={f} className="text-center text-[10px] pb-1" style={{ color: 'hsl(var(--score-ink) / 0.55)' }}>{f}</div>
          ))}
          {tuning.map((open, si) => (
            <div key={si} className="contents">
              <div className="text-[11px] font-mono flex items-center justify-center" style={{ color: 'hsl(var(--score-ink) / 0.7)' }}>
                {cfg.stringLabels?.[si]}
              </div>
              {Array.from({ length: frets + 1 }, (_, f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onPick({ key: midiToKey(open + f), tab: { str: si + 1, fret: f } })}
                  className="h-8 border-b border-r text-[10px] font-mono hover:bg-primary/25 transition-colors"
                  style={{ borderColor: 'hsl(var(--score-ink) / 0.18)', color: 'hsl(var(--score-ink) / 0.65)' }}
                >
                  {keyLabel(midiToKey(open + f)).replace(/\d/, '')}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Teclado clicable de piano. */
export const PianoPad = ({
  from = 48, to = 84, onPick,
}: { from?: number; to?: number; onPick: (key: string) => void }) => {
  const whites: number[] = [];
  for (let m = from; m <= to; m++) if (![1, 3, 6, 8, 10].includes(m % 12)) whites.push(m);
  const whiteW = 100 / whites.length;

  return (
    <div className="w-full overflow-x-auto rounded-xl p-2" style={{ background: 'hsl(var(--score-paper))' }}>
      <div className="relative min-w-[560px] h-28 select-none">
        <div className="flex h-full">
          {whites.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onPick(midiToKey(m))}
              className="flex-1 border rounded-b-md bg-white hover:bg-primary/20 transition-colors flex items-end justify-center pb-1 text-[9px] text-neutral-500"
              style={{ borderColor: 'hsl(var(--score-ink) / 0.25)' }}
            >
              {m % 12 === 0 ? keyLabel(midiToKey(m)) : ''}
            </button>
          ))}
        </div>
        {whites.map((m, i) => {
          const next = m + 1;
          if (next > to || ![1, 3, 6, 8, 10].includes(next % 12)) return null;
          return (
            <button
              key={`b-${next}`}
              type="button"
              onClick={() => onPick(midiToKey(next))}
              className="absolute top-0 h-16 rounded-b-md bg-neutral-900 hover:bg-primary transition-colors"
              style={{ left: `calc(${(i + 1) * whiteW}% - ${whiteW / 3.2}%)`, width: `${whiteW / 1.6}%` }}
              aria-label={keyLabel(midiToKey(next))}
            />
          );
        })}
      </div>
    </div>
  );
};

/** Piezas de batería. */
export const DrumPad = ({
  active, onToggle,
}: { active: DrumPiece[]; onToggle: (p: DrumPiece) => void }) => (
  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
    {DRUM_ORDER.map((p) => (
      <button
        key={p}
        type="button"
        onClick={() => onToggle(p)}
        className={cn(
          'rounded-lg border px-2 py-3 text-xs font-medium transition-colors',
          active.includes(p)
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted',
        )}
      >
        {DRUM_MAP[p].label}
      </button>
    ))}
  </div>
);

/** Notas rápidas para trompeta y instrumentos melódicos. */
export const QuickNotesPad = ({
  instrument, accidental, onPick,
}: { instrument: ScoreInstrument; accidental: '' | '#' | 'b'; onPick: (key: string) => void }) => {
  const cfg = SCORE_INSTRUMENTS[instrument];
  const keys = useMemo(() => {
    const out: string[] = [];
    for (let m = cfg.range[0]; m <= cfg.range[1]; m++) {
      const k = midiToKey(m);
      if (!k.includes('#')) out.push(accidental ? stepToKey(diatonicStep(k), accidental) : k);
    }
    return Array.from(new Set(out));
  }, [cfg.range, accidental]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPick(k)}
          className="px-2.5 py-1.5 rounded-md border border-border bg-muted/40 text-xs font-mono text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          {keyLabel(k)}
        </button>
      ))}
    </div>
  );
};

export const midiFromKey = keyToMidi;
