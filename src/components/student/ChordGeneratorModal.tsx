import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Piano, Guitar, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChordData {
  chordName: string;
  notes: string[];
  fingers?: string;
  keyPositions?: string;
  frets?: number[];
  barreInfo?: string | null;
  tips: string;
  variations?: string[];
  strumPattern?: string;
}

interface ChordGeneratorModalProps {
  userPlan: string;
}

export const ChordGeneratorModal = ({ userPlan }: ChordGeneratorModalProps) => {
  const [open, setOpen] = useState(false);
  const [chordName, setChordName] = useState('');
  const [instrument, setInstrument] = useState<'piano' | 'guitar'>('piano');
  const [loading, setLoading] = useState(false);
  const [chordData, setChordData] = useState<ChordData | null>(null);
  const { toast } = useToast();

  const allowedPlans = ['standard', 'pro'];
  const hasAccess = allowedPlans.includes(userPlan);

  const handleGenerateChord = async () => {
    if (!chordName.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa el nombre de un acorde',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setChordData(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-chord', {
        body: { chordName: chordName.trim(), instrument },
      });

      if (error) throw error;

      if (data.success && data.chord) {
        setChordData(data.chord);
      } else {
        throw new Error(data.error || 'Error generando el acorde');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el acorde. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGuitarFrets = (frets: number[], fingers?: number[]) => {
    const strings = ['E', 'A', 'D', 'G', 'B', 'e'];
    return (
      <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
        <div className="text-center mb-2 font-semibold">Diagrama de Guitarra</div>
        <div className="flex justify-center gap-4">
          {frets.map((fret, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs">{strings[idx]}</span>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                {fret === -1 ? 'X' : fret === 0 ? 'O' : fret}
              </div>
              {fingers && fingers[idx] > 0 && (
                <span className="text-xs text-muted-foreground mt-1">D{fingers[idx]}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPianoKeys = (notes: string[]) => {
    return (
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-center mb-2 font-semibold">Notas en el Piano</div>
        <div className="flex justify-center gap-2 flex-wrap">
          {notes.map((note, idx) => (
            <div
              key={idx}
              className="w-12 h-16 bg-background border-2 border-primary rounded flex items-end justify-center pb-2 font-semibold text-primary"
            >
              {note}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!hasAccess) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Music className="w-4 h-4" />
            Generador de Acordes
            <Lock className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Función Premium
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              El generador de acordes con IA está disponible para suscripciones Standard y Pro.
            </p>
            <Button variant="premium">Actualizar Suscripción</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Music className="w-4 h-4" />
          Generador de Acordes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Generador de Acordes con IA
          </DialogTitle>
        </DialogHeader>

        <Tabs value={instrument} onValueChange={(v) => setInstrument(v as 'piano' | 'guitar')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="piano" className="gap-2">
              <Piano className="w-4 h-4" />
              Piano
            </TabsTrigger>
            <TabsTrigger value="guitar" className="gap-2">
              <Guitar className="w-4 h-4" />
              Guitarra
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Do mayor, Am7, F#m, Gsus4..."
                value={chordName}
                onChange={(e) => setChordName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateChord()}
              />
              <Button onClick={handleGenerateChord} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generar'}
              </Button>
            </div>

            <TabsContent value="piano" className="mt-0">
              {chordData && chordData.notes && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{chordData.chordName}</h3>
                  {renderPianoKeys(chordData.notes)}
                  
                  {chordData.keyPositions && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="font-medium mb-1">Posición de teclas:</p>
                      <p className="text-sm text-muted-foreground">{chordData.keyPositions}</p>
                    </div>
                  )}
                  
                  {chordData.fingers && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="font-medium mb-1">Digitación:</p>
                      <p className="text-sm text-muted-foreground">{chordData.fingers}</p>
                    </div>
                  )}
                  
                  {chordData.tips && (
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="font-medium mb-1">💡 Consejos:</p>
                      <p className="text-sm">{chordData.tips}</p>
                    </div>
                  )}
                  
                  {chordData.variations && chordData.variations.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="font-medium mb-1">Variaciones:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {chordData.variations.map((v, i) => <li key={i}>{v}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="guitar" className="mt-0">
              {chordData && chordData.frets && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{chordData.chordName}</h3>
                  {renderGuitarFrets(chordData.frets, chordData.fingers as unknown as number[])}
                  
                  {chordData.notes && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="font-medium mb-1">Notas:</p>
                      <p className="text-sm text-muted-foreground">{chordData.notes.join(' - ')}</p>
                    </div>
                  )}
                  
                  {chordData.barreInfo && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="font-medium mb-1">Cejilla:</p>
                      <p className="text-sm text-muted-foreground">{chordData.barreInfo}</p>
                    </div>
                  )}
                  
                  {chordData.strumPattern && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="font-medium mb-1">Patrón de rasgueo:</p>
                      <p className="text-sm text-muted-foreground">{chordData.strumPattern}</p>
                    </div>
                  )}
                  
                  {chordData.tips && (
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="font-medium mb-1">💡 Consejos:</p>
                      <p className="text-sm">{chordData.tips}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
