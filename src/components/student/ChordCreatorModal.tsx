import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Guitar, Download, RotateCcw, Lock } from 'lucide-react';
import { useEnabledInstruments } from '@/hooks/useEnabledInstruments';
import { useToast } from '@/hooks/use-toast';

// -1 = muted, 0 = open, >=1 = fret pressed (absolute, not relative)
type StringState = number;

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']; // low → high
const FINGER_COLORS = ['#64748b', '#3b82f6', '#10b981', '#f59e0b', '#a855f7']; // idx 0 unused, 1..4

interface ChordCreatorModalProps {
  userInstrument?: string | null;
}

const ALLOWED = ['guitar', 'electric_guitar', 'bass'];

export const ChordCreatorModal = ({ userInstrument }: ChordCreatorModalProps) => {
  const { data: enabled } = useEnabledInstruments();
  const hasGuitar = enabled?.hasGuitar ?? true;
  const allowed = userInstrument ? ALLOWED.includes(userInstrument) : hasGuitar;

  const [open, setOpen] = useState(false);
  const [chordName, setChordName] = useState('Mi Acorde');
  const [startFret, setStartFret] = useState(1);
  const [numFrets] = useState(5);
  const [strings, setStrings] = useState<StringState[]>([-1, -1, -1, -1, -1, -1]);
  const [fingers, setFingers] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [activeFinger, setActiveFinger] = useState<number>(1);
  const [barreFret, setBarreFret] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  const reset = () => {
    setStrings([-1, -1, -1, -1, -1, -1]);
    setFingers([0, 0, 0, 0, 0, 0]);
    setBarreFret(null);
    setStartFret(1);
    setChordName('Mi Acorde');
  };

  const toggleAtFret = (stringIdx: number, absFret: number) => {
    const next = [...strings];
    const nextFingers = [...fingers];
    if (next[stringIdx] === absFret) {
      next[stringIdx] = -1;
      nextFingers[stringIdx] = 0;
    } else {
      next[stringIdx] = absFret;
      nextFingers[stringIdx] = activeFinger;
    }
    setStrings(next);
    setFingers(nextFingers);
  };

  const setTopMark = (stringIdx: number) => {
    const next = [...strings];
    const nextFingers = [...fingers];
    // cycle: muted (-1) → open (0) → muted
    next[stringIdx] = next[stringIdx] === 0 ? -1 : 0;
    nextFingers[stringIdx] = 0;
    setStrings(next);
    setFingers(nextFingers);
  };

  const toggleBarre = (absFret: number) => {
    setBarreFret((prev) => (prev === absFret ? null : absFret));
  };

  const download = async () => {
    if (!svgRef.current) return;
    try {
      const svg = svgRef.current;
      const serializer = new XMLSerializer();
      const src = serializer.serializeToString(svg);
      const svgBlob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('load'));
        img.src = url;
      });
      const scale = 3;
      const w = svg.viewBox.baseVal.width;
      const h = svg.viewBox.baseVal.height;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `${chordName.replace(/\s+/g, '_')}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast({ title: 'Descargado', description: 'Diagrama guardado como PNG.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo exportar el diagrama.', variant: 'destructive' });
    }
  };

  if (!allowed) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <Guitar className="w-4 h-4" /> Crear acorde <Lock className="w-3 h-3" />
      </Button>
    );
  }

  // Layout constants
  const width = 340;
  const height = 380;
  const leftPad = 50;
  const topPad = 70;
  const stringSpacing = 44;
  const fretSpacing = 50;
  const stringCount = 6;
  const boardW = stringSpacing * (stringCount - 1);
  const boardH = fretSpacing * numFrets;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Guitar className="w-4 h-4" /> Crear acorde
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto w-[95vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Guitar className="w-5 h-5" /> Crea tu propio acorde
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
          {/* Diagram */}
          <div className="bg-background rounded-lg border p-3 flex justify-center">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-[380px] h-auto"
              style={{ background: 'white' }}
            >
              {/* Chord name */}
              <text x={width / 2} y={28} textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
                {chordName || ' '}
              </text>

              {/* Start fret label */}
              {startFret > 1 && (
                <text x={leftPad - 12} y={topPad + fretSpacing / 2 + 5} textAnchor="end" fontSize="14" fill="#475569">
                  {startFret}fr
                </text>
              )}

              {/* Top mute/open markers */}
              {STRING_LABELS.map((_, i) => {
                const x = leftPad + i * stringSpacing;
                const state = strings[i];
                return (
                  <g key={`top-${i}`} onClick={() => setTopMark(i)} style={{ cursor: 'pointer' }}>
                    <rect x={x - 14} y={topPad - 36} width={28} height={26} fill="transparent" />
                    {state === -1 && (
                      <text x={x} y={topPad - 18} textAnchor="middle" fontSize="18" fontWeight="700" fill="#334155">×</text>
                    )}
                    {state === 0 && (
                      <circle cx={x} cy={topPad - 22} r={8} fill="none" stroke="#0f172a" strokeWidth={2} />
                    )}
                  </g>
                );
              })}

              {/* Nut (if starting fret 1) */}
              {startFret === 1 ? (
                <rect x={leftPad - 3} y={topPad - 6} width={boardW + 6} height={6} fill="#0f172a" />
              ) : (
                <line x1={leftPad} y1={topPad} x2={leftPad + boardW} y2={topPad} stroke="#94a3b8" strokeWidth={2} />
              )}

              {/* Fret lines */}
              {Array.from({ length: numFrets }, (_, f) => (
                <line
                  key={`fret-${f}`}
                  x1={leftPad}
                  y1={topPad + (f + 1) * fretSpacing}
                  x2={leftPad + boardW}
                  y2={topPad + (f + 1) * fretSpacing}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                />
              ))}

              {/* Strings */}
              {STRING_LABELS.map((_, i) => (
                <line
                  key={`s-${i}`}
                  x1={leftPad + i * stringSpacing}
                  y1={topPad}
                  x2={leftPad + i * stringSpacing}
                  y2={topPad + boardH}
                  stroke="#334155"
                  strokeWidth={1.5}
                />
              ))}

              {/* Barre */}
              {barreFret !== null && (() => {
                const rel = barreFret - startFret;
                if (rel < 0 || rel >= numFrets) return null;
                const cy = topPad + rel * fretSpacing + fretSpacing / 2;
                return (
                  <rect
                    x={leftPad - 6}
                    y={cy - 12}
                    width={boardW + 12}
                    height={24}
                    rx={12}
                    fill="#0f172a"
                    opacity={0.85}
                  />
                );
              })()}

              {/* Clickable fret cells */}
              {Array.from({ length: numFrets }, (_, f) =>
                STRING_LABELS.map((_, s) => {
                  const absFret = startFret + f;
                  const cx = leftPad + s * stringSpacing;
                  const cy = topPad + f * fretSpacing + fretSpacing / 2;
                  const pressed = strings[s] === absFret;
                  return (
                    <g key={`c-${f}-${s}`} onClick={() => toggleAtFret(s, absFret)} style={{ cursor: 'pointer' }}>
                      <rect x={cx - stringSpacing / 2} y={cy - fretSpacing / 2} width={stringSpacing} height={fretSpacing} fill="transparent" />
                      {pressed && (
                        <>
                          <circle cx={cx} cy={cy} r={14} fill={FINGER_COLORS[fingers[s]] || '#0f172a'} />
                          {fingers[s] > 0 && (
                            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
                              {fingers[s]}
                            </text>
                          )}
                        </>
                      )}
                    </g>
                  );
                })
              )}

              {/* Fret labels on right (for barre control) */}
              {Array.from({ length: numFrets }, (_, f) => {
                const absFret = startFret + f;
                const cy = topPad + f * fretSpacing + fretSpacing / 2;
                return (
                  <g key={`fl-${f}`} onClick={() => toggleBarre(absFret)} style={{ cursor: 'pointer' }}>
                    <rect x={leftPad + boardW + 4} y={cy - 12} width={30} height={24} fill="transparent" />
                    <text x={leftPad + boardW + 12} y={cy + 4} fontSize="12" fill="#64748b">
                      {absFret}
                    </text>
                  </g>
                );
              })}

              {/* String labels bottom */}
              {STRING_LABELS.map((n, i) => (
                <text
                  key={`sl-${i}`}
                  x={leftPad + i * stringSpacing}
                  y={topPad + boardH + 22}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                >
                  {n}
                </text>
              ))}
            </svg>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nombre del acorde</Label>
              <Input value={chordName} onChange={(e) => setChordName(e.target.value)} placeholder="Ej: Cmaj7" />
            </div>

            <div>
              <Label className="text-xs">Traste inicial</Label>
              <Select value={String(startFret)} onValueChange={(v) => setStartFret(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((f) => (
                    <SelectItem key={f} value={String(f)}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Dedo activo</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFinger(f)}
                    className={`w-10 h-10 rounded-full font-bold text-white transition-all ${activeFinger === f ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                    style={{ background: FINGER_COLORS[f] }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                1: Índice · 2: Medio · 3: Anular · 4: Meñique
              </p>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2 space-y-1">
              <p>• Clic en la cuerda arriba: alterna × / O / vacío</p>
              <p>• Clic en un traste: coloca el dedo activo</p>
              <p>• Clic en el número de traste (derecha): añade cejilla</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="gap-2 flex-1">
                <RotateCcw className="w-4 h-4" /> Limpiar
              </Button>
              <Button onClick={download} className="gap-2 flex-1">
                <Download className="w-4 h-4" /> PNG
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
