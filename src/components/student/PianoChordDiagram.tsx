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
  
  // Track which notes are pressed
  let pressedNoteIndex = 0;

  return (
    <div className="bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-300 dark:border-slate-700">
      <div className="text-center mb-4">
        <h4 className="font-bold text-lg text-foreground">{chordName}</h4>
        <p className="text-xs text-muted-foreground">Diagrama de Piano</p>
      </div>
      
      <div className="flex justify-center overflow-x-auto pb-2">
        <div className="relative inline-flex">
          {/* White keys */}
          <div className="flex">
            {whiteKeys.map((key, idx) => {
              const isPressed = isNotePressed(key.note, notes);
              const fingerNum = isPressed ? getFingerForNote(pressedNoteIndex++, notes.length) : 0;
              if (isPressed) pressedNoteIndex = Math.min(pressedNoteIndex, notes.length - 1);
              
              return (
                <div
                  key={`white-${idx}`}
                  className={cn(
                    "w-10 h-32 border border-slate-300 dark:border-slate-600 rounded-b-lg flex flex-col items-center justify-end pb-2 transition-all relative",
                    isPressed 
                      ? "bg-primary shadow-lg shadow-primary/30 border-primary" 
                      : "bg-white dark:bg-slate-100"
                  )}
                >
                  {isPressed && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                      <span className="text-xs font-bold text-primary">{fingerNum || '●'}</span>
                    </div>
                  )}
                  <span className={cn(
                    "text-xs font-medium",
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
              // Determine if there should be a black key after this white key
              const hasBlackKey = !['E', 'B'].includes(key.note);
              if (!hasBlackKey) return <div key={`space-${idx}`} className="w-10" />;
              
              const blackNote = key.note + '#';
              const isPressed = isNotePressed(blackNote, notes);
              
              return (
                <div key={`black-container-${idx}`} className="w-10 relative">
                  <div
                    className={cn(
                      "absolute -right-3 top-0 w-6 h-20 rounded-b-md z-10 flex flex-col items-center justify-end pb-1 transition-all",
                      isPressed
                        ? "bg-primary shadow-lg shadow-primary/50"
                        : "bg-slate-900 dark:bg-slate-950"
                    )}
                  >
                    {isPressed && (
                      <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center mb-1">
                        <span className="text-[10px] font-bold text-primary">●</span>
                      </div>
                    )}
                    <span className="text-[8px] text-white font-medium">{blackNote}</span>
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
      
      {/* Finger guide */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
        <span>1 = Pulgar</span>
        <span>2 = Índice</span>
        <span>3 = Medio</span>
        <span>4 = Anular</span>
        <span>5 = Meñique</span>
      </div>
      
      {fingers && (
        <div className="mt-3 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
          🎹 {fingers}
        </div>
      )}
    </div>
  );
};
