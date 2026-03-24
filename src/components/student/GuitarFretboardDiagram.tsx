import { useMemo } from 'react';

interface GuitarFretboardDiagramProps {
  notes: string[];
  rootNote?: string;
}

const STRING_TUNING = ['E', 'B', 'G', 'D', 'A', 'E']; // high to low
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  'E#': 'F', 'B#': 'C',
};
const FRET_COUNT = 15;
const DOT_FRETS = [3, 5, 7, 9, 12, 15];

function normalize(note: string): string {
  return ENHARMONIC[note] || note;
}

function getNoteAtFret(openNote: string, fret: number): string {
  const idx = ALL_NOTES.indexOf(normalize(openNote));
  return ALL_NOTES[(idx + fret) % 12];
}

const NOTE_COLORS: Record<string, string> = {
  root: 'fill-primary text-primary-foreground',
  note: 'fill-accent text-accent-foreground',
};

export const GuitarFretboardDiagram = ({ notes, rootNote }: GuitarFretboardDiagramProps) => {
  const normalizedNotes = useMemo(() => notes.map(normalize), [notes]);
  const normalizedRoot = rootNote ? normalize(rootNote) : normalizedNotes[0];

  const fretWidth = 52;
  const stringSpacing = 22;
  const leftPad = 30;
  const topPad = 24;
  const width = leftPad + fretWidth * FRET_COUNT + 10;
  const height = topPad + stringSpacing * (STRING_TUNING.length - 1) + 30;

  return (
    <div className="w-full overflow-x-auto rounded-lg bg-muted/30 p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[700px] w-full h-auto">
        {/* Nut */}
        <rect x={leftPad - 2} y={topPad - 4} width={4} height={stringSpacing * 5 + 8} rx={2} className="fill-foreground" />

        {/* Fret lines */}
        {Array.from({ length: FRET_COUNT }, (_, f) => (
          <line
            key={`fret-${f}`}
            x1={leftPad + fretWidth * (f + 1)}
            y1={topPad - 4}
            x2={leftPad + fretWidth * (f + 1)}
            y2={topPad + stringSpacing * 5 + 4}
            className="stroke-border"
            strokeWidth={1.5}
          />
        ))}

        {/* Fret dots */}
        {DOT_FRETS.map(f => (
          f === 12 ? (
            <g key={`dot-${f}`}>
              <circle cx={leftPad + fretWidth * f - fretWidth / 2} cy={topPad + stringSpacing * 1.5} r={3.5} className="fill-muted-foreground/30" />
              <circle cx={leftPad + fretWidth * f - fretWidth / 2} cy={topPad + stringSpacing * 3.5} r={3.5} className="fill-muted-foreground/30" />
            </g>
          ) : (
            <circle key={`dot-${f}`} cx={leftPad + fretWidth * f - fretWidth / 2} cy={topPad + stringSpacing * 2.5} r={3.5} className="fill-muted-foreground/30" />
          )
        ))}

        {/* Strings */}
        {STRING_TUNING.map((_, s) => (
          <line
            key={`string-${s}`}
            x1={leftPad - 4}
            y1={topPad + stringSpacing * s}
            x2={width - 10}
            y2={topPad + stringSpacing * s}
            className="stroke-muted-foreground/40"
            strokeWidth={s > 2 ? 1.5 + (s - 2) * 0.3 : 1}
          />
        ))}

        {/* String labels */}
        {STRING_TUNING.map((note, s) => (
          <text
            key={`label-${s}`}
            x={12}
            y={topPad + stringSpacing * s + 4}
            className="fill-muted-foreground text-[10px] font-mono"
            textAnchor="middle"
          >
            {note}
          </text>
        ))}

        {/* Fret numbers */}
        {Array.from({ length: FRET_COUNT }, (_, f) => (
          <text
            key={`fn-${f}`}
            x={leftPad + fretWidth * f + fretWidth / 2}
            y={topPad - 10}
            className="fill-muted-foreground/60 text-[9px] font-mono"
            textAnchor="middle"
          >
            {f + 1}
          </text>
        ))}

        {/* Notes on fretboard */}
        {STRING_TUNING.map((openNote, s) =>
          Array.from({ length: FRET_COUNT + 1 }, (_, f) => {
            const note = getNoteAtFret(openNote, f);
            if (!normalizedNotes.includes(note)) return null;
            const isRoot = note === normalizedRoot;
            const cx = f === 0 ? leftPad - 10 : leftPad + fretWidth * f - fretWidth / 2;
            const cy = topPad + stringSpacing * s;
            return (
              <g key={`${s}-${f}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={9}
                  className={isRoot ? NOTE_COLORS.root : NOTE_COLORS.note}
                  opacity={0.95}
                />
                <text
                  x={cx}
                  y={cy + 3.5}
                  textAnchor="middle"
                  className={`text-[8px] font-bold ${isRoot ? 'fill-primary-foreground' : 'fill-accent-foreground'}`}
                >
                  {notes[normalizedNotes.indexOf(note)] || note}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
};
