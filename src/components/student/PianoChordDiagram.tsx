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

const normalizeNote = (note: string): string => {
  return note
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .trim()
    .toUpperCase();
};

// Map flat notes to sharp equivalents
const flatToSharp: Record<string, string> = {
  'DB': 'C#', 'EB': 'D#', 'GB': 'F#', 'AB': 'G#', 'BB': 'A#',
};

const resolveNote = (note: string): string => {
  const n = normalizeNote(note);
  return flatToSharp[n] || n;
};

const fingerColors: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-orange-500',
  4: 'bg-red-500',
  5: 'bg-purple-500',
};

const getFingerForNote = (noteIndex: number, totalNotes: number): number => {
  if (totalNotes === 3) return [1, 3, 5][noteIndex] || noteIndex + 1;
  if (totalNotes === 4) return [1, 2, 3, 5][noteIndex] || noteIndex + 1;
  if (totalNotes === 5) return [1, 2, 3, 4, 5][noteIndex] || noteIndex + 1;
  return noteIndex + 1;
};

export const PianoChordDiagram = ({ notes, chordName, fingers }: PianoChordDiagramProps) => {
  const allKeys = [...PIANO_KEYS, ...PIANO_KEYS];

  // Resolve all chord notes to sharp notation
  const resolvedNotes = notes.map(n => resolveNote(n));

  // Build a map: resolved note name -> { fingerNum, originalNote, noteIndex }
  const noteMap = new Map<string, { fingerNum: number; original: string }>();
  resolvedNotes.forEach((rn, idx) => {
    noteMap.set(rn, { fingerNum: getFingerForNote(idx, notes.length), original: notes[idx] });
  });

  // White and black key data with press info
  const whiteKeys = allKeys.filter(k => !k.isBlack);

  return (
    <div className="bg-gradient-to-b from-muted/50 to-muted rounded-xl p-4 sm:p-6 border border-border">
      <div className="text-center mb-4">
        <h4 className="font-bold text-lg text-foreground">{chordName}</h4>
        <p className="text-xs text-muted-foreground">Diagrama de Piano</p>
      </div>

      <div className="flex justify-center overflow-x-auto pb-2">
        <div className="relative inline-flex">
          {/* White keys */}
          <div className="flex">
            {whiteKeys.map((key, idx) => {
              const info = noteMap.get(key.note);
              const isPressed = !!info;
              const fingerNum = info?.fingerNum || 0;

              return (
                <div
                  key={`white-${idx}`}
                  className={cn(
                    "w-8 sm:w-10 h-28 sm:h-32 border border-border rounded-b-lg flex flex-col items-center justify-end pb-2 transition-all relative",
                    isPressed
                      ? "bg-primary/20 border-primary shadow-lg shadow-primary/20"
                      : "bg-white dark:bg-slate-100"
                  )}
                >
                  {isPressed && (
                    <div className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-sm sm:text-base ring-2 ring-white/50",
                      fingerColors[fingerNum] || 'bg-primary'
                    )}>
                      {fingerNum}
                    </div>
                  )}
                  <span className={cn(
                    "text-[10px] sm:text-xs font-semibold",
                    isPressed ? "text-primary" : "text-slate-500 dark:text-slate-700"
                  )}>
                    {key.note}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Black keys overlay */}
          <div className="absolute top-0 left-0 flex pointer-events-none">
            {whiteKeys.map((key, idx) => {
              const hasBlackKey = !['E', 'B'].includes(key.note);
              if (!hasBlackKey) return <div key={`space-${idx}`} className="w-8 sm:w-10" />;

              const blackNote = key.note + '#';
              const info = noteMap.get(blackNote);
              const isPressed = !!info;
              const fingerNum = info?.fingerNum || 0;

              return (
                <div key={`black-container-${idx}`} className="w-8 sm:w-10 relative">
                  <div
                    className={cn(
                      "absolute -right-2.5 sm:-right-3 top-0 w-5 sm:w-6 h-16 sm:h-20 rounded-b-md z-10 flex flex-col items-center justify-center transition-all",
                      isPressed
                        ? "bg-primary shadow-lg shadow-primary/50 ring-2 ring-primary/30"
                        : "bg-slate-900 dark:bg-slate-950"
                    )}
                  >
                    {isPressed && (
                      <div className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-1 ring-white/30",
                        fingerColors[fingerNum] || 'bg-primary'
                      )}>
                        <span className="text-[10px] sm:text-xs">{fingerNum}</span>
                      </div>
                    )}
                    {!isPressed && (
                      <span className="text-[7px] sm:text-[8px] text-white/60 font-medium mt-auto mb-1">{blackNote}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notes display */}
      <div className="mt-4 flex justify-center gap-2 flex-wrap">
        {notes.map((note, idx) => {
          const fingerNum = getFingerForNote(idx, notes.length);
          return (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full border border-border"
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                fingerColors[fingerNum] || 'bg-primary'
              )}>
                {fingerNum}
              </div>
              <span className="text-sm font-medium text-foreground">{note}</span>
            </div>
          );
        })}
      </div>

      {/* Finger legend */}
      <div className="mt-4 flex justify-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">Dedos:</span>
        {[
          { num: 1, label: 'Pulgar', color: 'bg-blue-500' },
          { num: 2, label: 'Índice', color: 'bg-green-500' },
          { num: 3, label: 'Medio', color: 'bg-orange-500' },
          { num: 4, label: 'Anular', color: 'bg-red-500' },
          { num: 5, label: 'Meñique', color: 'bg-purple-500' },
        ].map(f => (
          <div key={f.num} className="flex items-center gap-1">
            <div className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full", f.color)} />
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
