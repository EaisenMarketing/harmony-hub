import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Loader2, Piano, Guitar, ScanLine, Sparkles, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEnabledInstruments, type Instrument } from '@/hooks/useEnabledInstruments';

interface DetectionResult {
  detectedChord: string | null;
  confidence?: number;
  notes?: string[];
  fingers?: string;
  handPosture?: string;
  suggestions?: string;
}

interface Props {
  userPlan: string;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const ChordPhotoDetector = ({ userPlan }: Props) => {
  const { data: enabled } = useEnabledInstruments();
  const hasPiano = enabled?.hasPiano ?? true;
  const hasGuitar = enabled?.hasGuitar ?? true;
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [instrument, setInstrument] = useState<Instrument>(hasPiano ? 'piano' : 'guitar');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const hasAccess = ['standard', 'pro', 'production'].includes(userPlan);

  const reset = () => {
    setPreview(null);
    setResult(null);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !user?.id) return;

    if (file.size > 8 * 1024 * 1024) {
      toast({ title: 'Imagen muy grande', description: 'Máximo 8MB.', variant: 'destructive' });
      return;
    }

    setResult(null);
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      setPreview(base64);

      // Upload to private bucket (user folder)
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('chord-photos')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadErr) throw uploadErr;

      // Call AI
      const { data, error } = await supabase.functions.invoke('detect-chord-from-image', {
        body: { imageBase64: base64, instrument },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error al analizar imagen');

      const r = data.result as DetectionResult;
      setResult(r);

      // Save to history
      await supabase.from('chord_detections').insert({
        user_id: user.id,
        instrument,
        detected_chord: r.detectedChord ?? null,
        confidence: typeof r.confidence === 'number' ? r.confidence : null,
        fingers: r.fingers ?? null,
        notes: Array.isArray(r.notes) ? r.notes : null,
        suggestions: r.suggestions ?? null,
        image_path: path,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        raw_response: r as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: (err as Error).message || 'No se pudo analizar la foto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <ScanLine className="w-4 h-4" />
        Detectar Acorde (Foto)
        <Lock className="w-3 h-3" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ScanLine className="w-4 h-4" />
          Detectar Acorde (Foto)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Detectar acorde por foto
          </DialogTitle>
        </DialogHeader>

        {!hasPiano && !hasGuitar ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
            Selecciona al menos un instrumento en Configuración → Mis instrumentos.
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={instrument} onValueChange={(v) => { setInstrument(v as Instrument); reset(); }}>
              <TabsList className={`grid w-full ${hasPiano && hasGuitar ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {hasPiano && (
                  <TabsTrigger value="piano" className="gap-2">
                    <Piano className="w-4 h-4" /> Piano
                  </TabsTrigger>
                )}
                {hasGuitar && (
                  <TabsTrigger value="guitar" className="gap-2">
                    <Guitar className="w-4 h-4" /> Guitarra
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            <p className="text-sm text-muted-foreground">
              Toma o sube una foto clara de tu mano formando un acorde en {instrument === 'piano' ? 'el piano' : 'la guitarra'}.
              La IA identificará el acorde y te dará sugerencias.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <Button
                variant="default"
                className="gap-2 h-20 flex-col"
                onClick={() => cameraRef.current?.click()}
                disabled={loading}
              >
                <Camera className="w-6 h-6" />
                Tomar foto
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-20 flex-col"
                onClick={() => galleryRef.current?.click()}
                disabled={loading}
              >
                <Upload className="w-6 h-6" />
                Subir foto
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analizando con IA…
              </div>
            )}

            {preview && (
              <div className="rounded-lg overflow-hidden border bg-muted/30">
                <img loading="lazy" decoding="async" src={preview} alt="Acorde" className="w-full max-h-64 object-contain" />
              </div>
            )}

            {result && (
              <div className="space-y-3">
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-xs text-muted-foreground uppercase">Acorde detectado</p>
                  <p className="text-2xl font-bold text-primary">
                    {result.detectedChord ?? 'No identificado'}
                  </p>
                  {typeof result.confidence === 'number' && (
                    <p className="text-sm text-muted-foreground">
                      Confianza: {Math.round(result.confidence * 100)}%
                    </p>
                  )}
                </div>

                {result.notes && result.notes.length > 0 && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="font-medium text-sm mb-1">Notas:</p>
                    <p className="text-sm text-muted-foreground">{result.notes.join(' · ')}</p>
                  </div>
                )}

                {result.fingers && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="font-medium text-sm mb-1">Dedos:</p>
                    <p className="text-sm text-muted-foreground">{result.fingers}</p>
                  </div>
                )}

                {result.handPosture && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="font-medium text-sm mb-1">Postura:</p>
                    <p className="text-sm text-muted-foreground">{result.handPosture}</p>
                  </div>
                )}

                {result.suggestions && (
                  <div className="rounded-lg bg-primary/10 p-3">
                    <p className="font-medium text-sm mb-1">💡 Sugerencias:</p>
                    <p className="text-sm">{result.suggestions}</p>
                  </div>
                )}

                <Button variant="outline" onClick={reset} className="w-full">
                  Analizar otra foto
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
