import { cn } from '@/lib/utils';

interface GuitarChordDiagramProps {
  frets: number[];
  fingers?: number[];
  chordName: string;
  barreInfo?: string | null;
}

export const GuitarChordDiagram = ({ frets, fingers, chordName, barreInfo }: GuitarChordDiagramProps) => {
  const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];
  
  // Calculate the fret range to display
  const playedFrets = frets.filter(f => f > 0);
  const minFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 1;
  const maxFret = playedFrets.length > 0 ? Math.max(...playedFrets) : 4;
  
  // Determine starting fret position for display
  let startFret = 1;
  if (minFret > 4) {
    startFret = minFret;
  } else if (maxFret > 4) {
    startFret = Math.max(1, minFret);
  }
  
  const numFretsToShow = 5;
  const fretRange = Array.from({ length: numFretsToShow }, (_, i) => startFret + i);
  
  // Check if there's a barre
  const hasBarre = barreInfo !== null && barreInfo !== undefined;
  const barreFret = hasBarre ? minFret : null;
  
  // Finger colors for visual distinction
  const fingerColors: Record<number, string> = {
    1: 'bg-blue-500',
    2: 'bg-green-500',
    3: 'bg-orange-500',
    4: 'bg-purple-500',
  };

  return (
    <div className="bg-gradient-to-b from-amber-900/20 to-amber-800/10 rounded-xl p-6 border border-amber-900/30">
      <div className="text-center mb-4">
        <h4 className="font-bold text-lg text-foreground">{chordName}</h4>
        <p className="text-xs text-muted-foreground">Diagrama de Guitarra</p>
      </div>
      
      <div className="flex justify-center">
        <div className="relative">
          {/* Fret position indicator */}
          {startFret > 1 && (
            <div className="absolute -left-8 top-8 text-sm font-bold text-muted-foreground">
              {startFret}fr
            </div>
          )}
          
          {/* String names at top */}
          <div className="flex mb-2">
            {stringNames.map((name, idx) => (
              <div key={name} className="w-10 text-center">
                <span className="text-xs font-medium text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
          
          {/* Open/Muted string indicators */}
          <div className="flex mb-1 h-6">
            {frets.map((fret, idx) => (
              <div key={`open-${idx}`} className="w-10 flex justify-center">
                {fret === 0 && (
                  <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">O</span>
                  </div>
                )}
                {fret === -1 && (
                  <span className="text-lg font-bold text-muted-foreground">✕</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Nut (only if starting from fret 1) */}
          {startFret === 1 && (
            <div className="flex">
              {stringNames.map((_, idx) => (
                <div key={`nut-${idx}`} className="w-10 flex justify-center">
                  <div className="w-1 h-2 bg-foreground rounded-sm" />
                </div>
              ))}
            </div>
          )}
          
          {/* Fretboard */}
          <div className="relative border-l-2 border-r-2 border-amber-900/50">
            {fretRange.map((fretNum, fretIdx) => (
              <div key={fretNum} className="flex border-b-2 border-amber-900/40 relative">
                {stringNames.map((_, stringIdx) => {
                  const currentFret = frets[stringIdx];
                  const currentFinger = fingers ? fingers[stringIdx] : 0;
                  const isPressed = currentFret === fretNum;
                  
                  return (
                    <div 
                      key={`${fretNum}-${stringIdx}`} 
                      className="w-10 h-12 relative flex items-center justify-center"
                    >
                      {/* String line */}
                      <div className={cn(
                        "absolute top-0 bottom-0 w-0.5 left-1/2 -translate-x-1/2",
                        stringIdx < 3 ? "bg-amber-400/60" : "bg-gray-300/60"
                      )} />
                      
                      {/* Finger dot */}
                      {isPressed && (
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm z-10 shadow-lg",
                          fingerColors[currentFinger] || 'bg-primary'
                        )}>
                          {currentFinger > 0 ? currentFinger : '●'}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Fret number on the right */}
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {fretNum}
                </div>
              </div>
            ))}
            
            {/* Barre indicator */}
            {hasBarre && barreFret && (
              <div 
                className="absolute left-2 right-2 h-6 bg-primary/30 rounded-full border-2 border-primary flex items-center justify-center"
                style={{ 
                  top: `${(barreFret - startFret) * 48 + 18}px`
                }}
              >
                <span className="text-[10px] font-bold text-primary">CEJILLA</span>
              </div>
            )}
          </div>
          
          {/* Finger legend */}
          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Dedos:</span>
            {[1, 2, 3, 4].map(finger => (
              <div key={finger} className="flex items-center gap-1">
                <div className={cn("w-4 h-4 rounded-full", fingerColors[finger])} />
                <span className="text-xs text-muted-foreground">
                  {finger === 1 ? 'Índice' : finger === 2 ? 'Medio' : finger === 3 ? 'Anular' : 'Meñique'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {barreInfo && (
        <div className="mt-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
          🎸 {barreInfo}
        </div>
      )}
    </div>
  );
};
