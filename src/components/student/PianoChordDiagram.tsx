import { cn } from '@/lib/utils';

interface PianoChordDiagramProps {
  notes: string[];
  chordName: string;
  fingers?: string;
}

// Piano key layout - two octaves
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

// Normalize note names for comparison
const normalizeNote = (note: string): string => {
  return note
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/mayor/gi, '')
    .replace(/menor/gi, '')
    .replace(/m$/i, '')
    .trim()
    .toUpperCase();
};

// Check if a piano key matches any of the chord notes
const isNotePressed = (keyNote: string, chordNotes: string[]): boolean => {
  const normalizedKey = normalizeNote(keyNote);
  return chordNotes.some(note => {
    const normalized = normalizeNote(note);
    // Handle enharmonic equivalents
    const enharmonics: Record<string, string> = {
      'C#': 'DB', 'DB': 'C#',
      'D#': 'EB', 'EB': 'D#',
      'F#': 'GB', 'GB': 'F#',
      'G#': 'AB', 'AB': 'G#',
      'A#': 'BB', 'BB': 'A#',
    };
    return normalized === normalizedKey || 
           normalized === enharmonics[normalizedKey] ||
           normalizedKey === enharmonics[normalized];
  });
};

// Get finger number for a note (1=thumb, 2=index, etc.)
const getFingerForNote = (noteIndex: number, totalNotes: number): number => {
  if (totalNotes === 3) {
    return [1, 3, 5][noteIndex] || 0;
  } else if (totalNotes === 4) {
    return [1, 2, 3, 5][noteIndex] || 0;
  }
  return noteIndex + 1;
};

export const PianoChordDiagram = ({ notes, chordName, fingers }: PianoChordDiagramProps) => {
  // Create two octaves of keys
  const allKeys = [...PIANO_KEYS, ...PIANO_KEYS];
  
  // Get only the white keys for layout
  const whiteKeys = allKeys.filter(k => !k.isBlack);
  
  // Pre-calculate which keys are pressed and assign finger numbers
  const pressedWhiteKeys = new Map<number, number>();
  const pressedBlackKeys = new Map<string, number>();
  let noteIdx = 0;
  
  // First pass: identify pressed white keys
  whiteKeys.forEach((key, idx) => {
    if (isNotePressed(key.note, notes)) {
      pressedWhiteKeys.set(idx, getFingerForNote(noteIdx, notes.length));
      noteIdx++;
    }
  });
  
  // Second pass: identify pressed black keys
  noteIdx = 0;
  let _blackNoteIdx = pressedWhiteKeys.size; // Start after white key assignments
  whiteKeys.forEach((key, idx) => {
    const hasBlackKey = !['E', 'B'].includes(key.note);
    if (!hasBlackKey) return;
    const blackNote = key.note + '#';
    if (isNotePressed(blackNote, notes)) {
      // Find the correct finger index for this note
      let fingerIdx = 0;
      for (const note of notes) {
        const normalized = normalizeNote(note);
        const normalizedBlack = normalizeNote(blackNote);
        if (normalized === normalizedBlack || 
            normalized === ({ 'C#': 'DB', 'D#': 'EB', 'F#': 'GB', 'G#': 'AB', 'A#': 'BB' } as Record<string, string>)[normalizedBlack]) {
          break;
        }
        fingerIdx++;
      }
      pressedBlackKeys.set(`${idx}-${blackNote}`, getFingerForNote(fingerIdx, notes.length));
    }
  });

  // Finger colors for visual distinction (matching guitar style)
  const fingerColors: Record<number, string> = {
    1: 'bg-blue-500',
    2: 'bg-green-500',
    3: 'bg-orange-500',
    4: 'bg-red-500',
    5: 'bg-purple-500',
  };

  return (
    <div className="bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 sm:p-6 border border-slate-300 dark:border-slate-700">
      <div className="text-center mb-4">
        <h4 className="font-bold text-lg text-foreground">{chordName}</h4>
        <p className="text-xs text-muted-foreground">Diagrama de Piano</p>
      </div>
      
      <div className="flex justify-center overflow-x-auto pb-2">
        <div className="relative inline-flex">
          {/* White keys */}
          <div className="flex">
            {whiteKeys.map((key, idx) => {
              const isPressed = pressedWhiteKeys.has(idx);
              const fingerNum = pressedWhiteKeys.get(idx) || 0;
              
              return (
                <div
                  key={`white-${idx}`}
                  className={cn(
                    "w-8 sm:w-10 h-28 sm:h-32 border border-slate-300 dark:border-slate-600 rounded-b-lg flex flex-col items-center justify-end pb-2 transition-all relative",
                    isPressed 
                      ? "bg-primary shadow-lg shadow-primary/30 border-primary" 
                      : "bg-white dark:bg-slate-100"
                  )}
                >
                  {isPressed && (
                    <div className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-xs sm:text-sm",
                      fingerColors[fingerNum] || 'bg-primary'
                    )}>
                      {fingerNum}
                    </div>
                  )}
                  <span className={cn(
                    "text-[10px] sm:text-xs font-medium",
                    isPressed ? "text-white" : "text-slate-600 dark:text-slate-800"
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
              const blackKey = `${idx}-${blackNote}`;
              const isPressed = pressedBlackKeys.has(blackKey);
              const fingerNum = pressedBlackKeys.get(blackKey) || 0;
              
              return (
                <div key={`black-container-${idx}`} className="w-8 sm:w-10 relative">
                  <div
                    className={cn(
                      "absolute -right-2.5 sm:-right-3 top-0 w-5 sm:w-6 h-16 sm:h-20 rounded-b-md z-10 flex flex-col items-center justify-end pb-1 transition-all",
                      isPressed
                        ? "bg-primary shadow-lg shadow-primary/50"
                        : "bg-slate-900 dark:bg-slate-950"
                    )}
                  >
                    {isPressed && (
                      <div className={cn(
                        "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center mb-1 text-white font-bold shadow-lg",
                        fingerColors[fingerNum] || 'bg-primary'
                      )}>
                        <span className="text-[9px] sm:text-[10px]">{fingerNum}</span>
                      </div>
                    )}
                    <span className="text-[7px] sm:text-[8px] text-white font-medium">{blackNote}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Notes display */}
      <div className="mt-4 flex justify-center gap-2 flex-wrap">
        {notes.map((note, idx) => (
          <div
            key={idx}
            className="px-3 py-1.5 bg-primary/20 rounded-full text-sm font-medium text-primary border border-primary/30"
          >
            {note}
          </div>
        ))}
      </div>
      
      {/* Finger legend with colors */}
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
        <div className="mt-3 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
          🎹 {fingers}
        </div>
      )}
    </div>
  );
};
