import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Square, Upload, Sparkles, Loader2, RotateCcw, FileAudio } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { INSTRUMENT_PLAN_MAP, type InstrumentSlug } from '@/lib/instrument-access';

const MAX_BYTES = 15 * 1024 * 1024;

const fileToBase64 = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const PracticeFeedbackModal = () => {
  const { data: userIns } = useUserInstrument();
  const primary = (userIns?.instrument ?? null) as InstrumentSlug | null;
  const defaultLabel = primary ? INSTRUMENT_PLAN_MAP[primary]?.label : '';

  const [open, setOpen] = useState(false);
  const [instrument, setInstrument] = useState(defaultLabel || 'Guitarra Acústica');
  const [level, setLevel] = useState('intermedio');
  const [piece, setPiece] = useState('');
  const [goals, setGoals] = useState('');
  const [file, setFile] = useState<File | Blob | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileMime, setFileMime] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const setBlob = (blob: Blob, name: string) => {
    setFile(blob);
    setFileName(name);
    setFileMime(blob.type || 'audio/webm');
    setAudioUrl(URL.createObjectURL(blob));
    setFeedback(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        setBlob(blob, `grabacion.${mime.includes('mp4') ? 'm4a' : 'webm'}`);
        setRecording(false);
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch {
      toast({ title: 'Micrófono no disponible', description: 'Concede permiso al micrófono.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast({ title: 'Archivo demasiado grande', description: 'Máximo 15 MB. Prueba con un fragmento más corto.', variant: 'destructive' });
      return;
    }
    // Video: intentamos igual — el navegador puede pasar audio/* si el usuario extrajo audio.
    if (!f.type.startsWith('audio/') && !f.type.startsWith('video/')) {
      toast({ title: 'Formato no soportado', description: 'Sube audio (mp3, wav, m4a, webm) o extrae el audio del video.', variant: 'destructive' });
      return;
    }
    if (f.type.startsWith('video/')) {
      toast({ title: 'Video detectado', description: 'Analizaremos solo la pista de audio.' });
    }
    setBlob(f, f.name);
  };

  const analyze = async () => {
    if (!file) {
      toast({ title: 'Sin audio', description: 'Graba o sube un archivo.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('practice-feedback', {
        body: {
          audioBase64: base64,
          mimeType: fileMime || 'audio/webm',
          instrument,
          level,
          piece,
          goals,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error');
      setFeedback(data.feedback);
    } catch (e: unknown) {
      toast({
        title: 'Error analizando tu grabación',
        description: e instanceof Error ? e.message : 'Intenta con un audio más corto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setFileName(''); setFileMime(''); setAudioUrl(null); setFeedback(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mic className="w-4 h-4" />
          Feedback IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Feedback de práctica con IA
          </DialogTitle>
          <DialogDescription>
            Sube o graba tu práctica (máx 15 MB) y recibe correcciones específicas para tu instrumento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {!feedback ? (
            <ScrollArea className="h-full pr-3">
              <div className="space-y-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Instrumento</Label>
                    <Input value={instrument} onChange={(e) => setInstrument(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nivel</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="principiante">Principiante</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pieza o ejercicio (opcional)</Label>
                  <Input value={piece} onChange={(e) => setPiece(e.target.value)} placeholder="Ej: Wonderwall, escala de Do mayor, groove en 4/4..." />
                </div>
                <div className="space-y-2">
                  <Label>¿En qué quieres que me enfoque? (opcional)</Label>
                  <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} placeholder="Ej: revisa mi ritmo y afinación en el estribillo." />
                </div>

                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Tu grabación</p>
                  <div className="flex flex-wrap gap-2">
                    {!recording ? (
                      <Button onClick={startRecording} variant="secondary" className="gap-2">
                        <Mic className="w-4 h-4" /> Grabar ahora
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} variant="destructive" className="gap-2 animate-pulse">
                        <Square className="w-4 h-4" /> Detener
                      </Button>
                    )}
                    <label>
                      <input type="file" accept="audio/*,video/*" onChange={onFileChange} className="hidden" />
                      <Button asChild variant="outline" className="gap-2 cursor-pointer">
                        <span><Upload className="w-4 h-4" /> Subir audio/video</span>
                      </Button>
                    </label>
                    {file && (
                      <Button onClick={reset} variant="ghost" size="sm" className="gap-2">
                        <RotateCcw className="w-3 h-3" /> Quitar
                      </Button>
                    )}
                  </div>
                  {file && audioUrl && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileAudio className="w-3 h-3" />
                        {fileName} · {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <audio src={audioUrl} controls className="w-full" />
                    </div>
                  )}
                </div>

                <Button onClick={analyze} disabled={loading || !file || recording} className="w-full gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Analizando tu práctica...' : 'Obtener feedback'}
                </Button>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1 pr-3">
                <div className="prose prose-sm dark:prose-invert max-w-none pb-4">
                  <ReactMarkdown>{feedback}</ReactMarkdown>
                </div>
              </ScrollArea>
              <div className="flex gap-2 pt-3 border-t">
                <Button onClick={() => setFeedback(null)} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Nuevo análisis
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(feedback);
                    toast({ title: 'Feedback copiado' });
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
