import { cn } from '@/lib/utils';

interface PianoChordDiagramProps {
  notes: string[];
  chordName: string;
  fingers?: string;
}

const PIANO_KEYS = [
  { note: 'C', isBlack: false },
  { note: 'C#', isBlack: true },
  { note: 'D', isBlack: false },
  { note: 'D#', isBlack: true },
  { note: 'E', isBlack: false },
  { note: 'F', isBlack: false },
  { note: 'F#', isBlack: true },
  { note: 'G', isBlack: false },
  { note: 'G#', isBlack: true },
  { note: 'A', isBlack: false },
  { note: 'A#', isBlack: true },
  { note: 'B', isBlack: false },
];

const NOTE_BASE_MAP: Record<string, string> = {
  DO: 'C',
  RE: 'D',
  MI: 'E',
  FA: 'F',
  SOL: 'G',
  LA: 'A',
  SI: 'B',
  TI: 'B',
  H: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  A: 'A',
  B: 'B',
};

const FLAT_TO_SHARP: Record<string, string> = {
  DB: 'C#',
  EB: 'D#',
  GB: 'F#',
  AB: 'G#',
  BB: 'A#',
};

const fingerColorClasses: Record<number, string> = {
  1: 'bg-[hsl(var(--chart-1))]',
  2: 'bg-[hsl(var(--chart-2))]',
  3: 'bg-[hsl(var(--chart-3))]',
  4: 'bg-[hsl(var(--chart-4))]',
  5: 'bg-[hsl(var(--chart-5))]',
};

const extractPitchClass = (rawNote: string): string => {
  const normalized = rawNote
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .toUpperCase()
    .replace(/\(.*?\)/g, ' ')
    .trim();

  const match = normalized.match(/(SOL|DO|RE|MI|FA|LA|SI|TI|[A-GH])\s*([#B]?)/);
  if (!match) return '';

  const base = NOTE_BASE_MAP[match[1]] ?? match[1];
  const accidental = match[2] === 'B' ? 'B' : match[2] === '#' ? '#' : '';

  return `${base}${accidental}`;
};

const resolveNote = (note: string): string => {
  const pitchClass = extractPitchClass(note);
  return FLAT_TO_SHARP[pitchClass] || pitchClass;
};

const getFingerForNote = (noteIndex: number, totalNotes: number): number => {
  if (totalNotes === 3) return [1, 3, 5][noteIndex] || noteIndex + 1;
  if (totalNotes === 4) return [1, 2, 3, 5][noteIndex] || noteIndex + 1;
  if (totalNotes >= 5) return [1, 2, 3, 4, 5][noteIndex] || noteIndex + 1;
  return noteIndex + 1;
};

export const PianoChordDiagram = ({ notes, chordName, fingers }: PianoChordDiagramProps) => {
  const allKeys = [...PIANO_KEYS, ...PIANO_KEYS];
  const whiteKeys = allKeys.filter((k) => !k.isBlack);

  const noteMap = new Map<string, { fingerNum: number; original: string }>();
  notes.forEach((note, idx) => {
    const resolved = resolveNote(note);
    if (!resolved) return;
    noteMap.set(resolved, {
      fingerNum: getFingerForNote(idx, notes.length),
      original: note,
    });
  });

  return (
    <div className="bg-gradient-to-b from-muted/40 to-muted rounded-xl p-4 sm:p-6 border border-border">
      <div className="text-center mb-4">
        <h4 className="font-bold text-lg text-foreground">{chordName}</h4>
        <p className="text-xs text-muted-foreground">Diagrama de Piano</p>
      </div>

      <div className="flex justify-center overflow-x-auto pb-2">
        <div className="relative inline-flex">
          <div className="flex">
            {whiteKeys.map((key, idx) => {
              const info = noteMap.get(key.note);
              const isPressed = Boolean(info);
              const fingerNum = info?.fingerNum ?? 0;

              return (
                <div
                  key={`white-${idx}`}
                  className={cn(
                    'w-8 sm:w-10 h-28 sm:h-32 border border-border rounded-b-lg flex flex-col items-center justify-end pb-2 transition-all relative',
                    isPressed
                      ? 'bg-primary/15 border-primary shadow-lg shadow-primary/20'
                      : 'bg-background'
                  )}
                >
                  {isPressed && (
                    <div
                      className={cn(
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg text-primary-foreground font-bold text-sm sm:text-base ring-2 ring-background/70',
                        fingerColorClasses[fingerNum] || 'bg-primary'
                      )}
                    >
                      {fingerNum}
                    </div>
                  )}
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs font-semibold',
                      isPressed ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {key.note}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="absolute top-0 left-0 flex pointer-events-none">
            {whiteKeys.map((key, idx) => {
              const hasBlackKey = !['E', 'B'].includes(key.note);
              if (!hasBlackKey) return <div key={`space-${idx}`} className="w-8 sm:w-10" />;

              const blackNote = `${key.note}#`;
              const info = noteMap.get(blackNote);
              const isPressed = Boolean(info);
              const fingerNum = info?.fingerNum ?? 0;

              return (
                <div key={`black-container-${idx}`} className="w-8 sm:w-10 relative">
                  <div
                    className={cn(
                      'absolute -right-2.5 sm:-right-3 top-0 w-5 sm:w-6 h-16 sm:h-20 rounded-b-md z-10 flex flex-col items-center justify-center transition-all',
                      isPressed
                        ? 'bg-primary shadow-lg shadow-primary/40 ring-2 ring-primary/30'
                        : 'bg-foreground'
                    )}
                  >
                    {isPressed ? (
                      <div
                        className={cn(
                          'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-lg ring-1 ring-background/40',
                          fingerColorClasses[fingerNum] || 'bg-primary'
                        )}
                      >
                        <span className="text-[10px] sm:text-xs">{fingerNum}</span>
                      </div>
                    ) : (
                      <span className="text-[7px] sm:text-[8px] text-background/80 font-medium mt-auto mb-1">
                        {blackNote}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2 flex-wrap">
        {notes.map((note, idx) => {
          const fingerNum = getFingerForNote(idx, notes.length);
          return (
            <div
              key={`${note}-${idx}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full border border-border"
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-bold',
                  fingerColorClasses[fingerNum] || 'bg-primary'
                )}
              >
                {fingerNum}
              </div>
              <span className="text-sm font-medium text-foreground">{note}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">Dedos:</span>
        {[
          { num: 1, label: 'Pulgar' },
          { num: 2, label: 'Índice' },
          { num: 3, label: 'Medio' },
          { num: 4, label: 'Anular' },
          { num: 5, label: 'Meñique' },
        ].map((f) => (
          <div key={f.num} className="flex items-center gap-1">
            <div className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full', fingerColorClasses[f.num])} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{f.label}</span>
          </div>
        ))}
      </div>

      {fingers && (
        <div className="mt-3 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 border border-border">
          🎹 {fingers}
        </div>
      )}
    </div>
  );
};
