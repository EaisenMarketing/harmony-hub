import { useMemo } from 'react';

interface ScalePianoKeyboardProps {
  notes: string[];
  rootNote?: string;
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  'E#': 'F', 'B#': 'C',
};
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]); // indices in ALL_NOTES

function normalize(note: string): string {
  return ENHARMONIC[note] || note;
}

const OCTAVES = 2;
const WHITE_WIDTH = 32;
const WHITE_HEIGHT = 100;
const BLACK_WIDTH = 20;
const BLACK_HEIGHT = 62;

export const ScalePianoKeyboard = ({ notes, rootNote }: ScalePianoKeyboardProps) => {
  const normalizedNotes = useMemo(() => notes.map(normalize), [notes]);
  const normalizedRoot = rootNote ? normalize(rootNote) : normalizedNotes[0];

  const keys = useMemo(() => {
    const result: { note: string; displayNote: string; isBlack: boolean; octave: number; noteIndex: number }[] = [];
    for (let oct = 0; oct < OCTAVES; oct++) {
      ALL_NOTES.forEach((note, idx) => {
        const origIdx = normalizedNotes.indexOf(note);
        result.push({
          note,
          displayNote: origIdx >= 0 ? notes[origIdx] : note,
          isBlack: BLACK_KEYS.has(idx),
          octave: oct,
          noteIndex: idx,
        });
      });
    }
    return result;
  }, [notes, normalizedNotes]);

  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);
  const totalWidth = whiteKeys.length * WHITE_WIDTH;

  // Map white key index for positioning
  let whiteIdx = 0;
  const whitePositions: Record<string, number> = {};
  keys.forEach(k => {
    const key = `${k.note}-${k.octave}`;
    if (!k.isBlack) {
      whitePositions[key] = whiteIdx * WHITE_WIDTH;
      whiteIdx++;
    }
  });

  // Black key positions: between the white keys
  const getBlackKeyX = (noteIdx: number, octave: number): number => {
    // Find the white key just before this black key
    const prevWhiteIdx = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][noteIdx]; // which white key # in octave
    const x = (octave * 7 + prevWhiteIdx + 1) * WHITE_WIDTH - BLACK_WIDTH / 2;
    return x;
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg bg-muted/30 p-3">
      <svg viewBox={`0 0 ${totalWidth} ${WHITE_HEIGHT + 20}`} className="min-w-[400px] w-full h-auto">
        {/* White keys */}
        {whiteKeys.map((k, i) => {
          const isActive = normalizedNotes.includes(k.note);
          const isRoot = k.note === normalizedRoot;
          const x = i * WHITE_WIDTH;
          return (
            <g key={`w-${i}`}>
              <rect
                x={x + 1}
                y={0}
                width={WHITE_WIDTH - 2}
                height={WHITE_HEIGHT}
                rx={3}
                className={
                  isRoot
                    ? 'fill-primary stroke-primary/50'
                    : isActive
                    ? 'fill-accent stroke-accent/50'
                    : 'fill-white stroke-border'
                }
                strokeWidth={1}
              />
              {isActive && (
                <text
                  x={x + WHITE_WIDTH / 2}
                  y={WHITE_HEIGHT - 10}
                  textAnchor="middle"
                  className={`text-[10px] font-bold ${isRoot ? 'fill-primary-foreground' : 'fill-accent-foreground'}`}
                >
                  {k.displayNote}
                </text>
              )}
            </g>
          );
        })}

        {/* Black keys */}
        {blackKeys.map((k, i) => {
          const isActive = normalizedNotes.includes(k.note);
          const isRoot = k.note === normalizedRoot;
          const x = getBlackKeyX(k.noteIndex, k.octave);
          return (
            <g key={`b-${i}`}>
              <rect
                x={x}
                y={0}
                width={BLACK_WIDTH}
                height={BLACK_HEIGHT}
                rx={2}
                className={
                  isRoot
                    ? 'fill-primary stroke-primary'
                    : isActive
                    ? 'fill-accent stroke-accent'
                    : 'fill-foreground stroke-foreground'
                }
                strokeWidth={0.5}
              />
              {isActive && (
                <text
                  x={x + BLACK_WIDTH / 2}
                  y={BLACK_HEIGHT - 8}
                  textAnchor="middle"
                  className={`text-[8px] font-bold ${isRoot || isActive ? 'fill-primary-foreground' : 'fill-foreground'}`}
                >
                  {k.displayNote}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
