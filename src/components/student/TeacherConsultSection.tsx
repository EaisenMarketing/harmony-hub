import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageCircleQuestion, Send, ImagePlus, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  Instrument,
  useAvailableInstructors,
  useCreateQuestion,
  useMyQuestions,
} from '@/hooks/useTeacherQuestions';
import { uploadCommunityImage } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const instrumentLabels: Record<Instrument, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Producción',
};

export const TeacherConsultSection = () => {
  const { user } = useAuth();
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [instructorId, setInstructorId] = useState<string>('any');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: instructors } = useAvailableInstructors(instrument);
  const { data: myQuestions, isLoading } = useMyQuestions();
  const create = useCreateQuestion();

  const reset = () => {
    setTitle('');
    setBody('');
    setFile(null);
    setInstructorId('any');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 4 || body.trim().length < 10) {
      toast({ title: 'Datos incompletos', description: 'Añade un título y descripción más completos.', variant: 'destructive' });
      return;
    }
    try {
      let image_url: string | null = null;
      if (file && user) {
        setUploading(true);
        image_url = await uploadCommunityImage(user.id, file);
      }
      await create.mutateAsync({
        instrument,
        instructor_id: instructorId === 'any' ? null : instructorId,
        title: title.trim(),
        body: body.trim(),
        image_url,
      });
      toast({ title: '¡Consulta enviada!', description: 'Te avisaremos cuando tu maestro responda.' });
      reset();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo enviar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
          <MessageCircleQuestion className="w-7 h-7 text-primary" />
          Pregunta al Maestro
        </h1>
        <p className="text-muted-foreground mt-1">
          Envía tu duda a un instructor. Recibirás un email cuando responda.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nueva consulta</CardTitle>
          <CardDescription>Sé específico para obtener la mejor respuesta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instrumento / área</Label>
                <Select value={instrument} onValueChange={(v) => { setInstrument(v as Instrument); setInstructorId('any'); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guitar">Guitarra</SelectItem>
                    <SelectItem value="piano">Piano</SelectItem>
                    <SelectItem value="drums">Producción Musical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Maestro destinatario</Label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Cualquier maestro disponible</SelectItem>
                    {instructors?.map((i) => (
                      <SelectItem key={i.user_id} value={i.user_id}>
                        {i.profile?.full_name || 'Maestro'} {i.specialization ? `· ${i.specialization}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Cómo hago el barre en F mayor"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label>Tu pregunta</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Explica con detalle lo que necesitas resolver..."
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{body.length}/2000</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 cursor-pointer w-fit">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm">
                  <ImagePlus className="w-4 h-4" />
                  {file ? file.name : 'Adjuntar imagen (opcional)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Label>
            </div>

            <Button type="submit" disabled={create.isPending || uploading} className="gap-2">
              {(create.isPending || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar consulta
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mis consultas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {!isLoading && !myQuestions?.length && (
            <p className="text-sm text-muted-foreground">Aún no tienes consultas enviadas.</p>
          )}
          {myQuestions?.map((q) => (
            <div key={q.id} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{q.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {instrumentLabels[q.instrument]} ·{' '}
                    {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
                {q.status === 'answered' ? (
                  <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Respondida</Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pendiente</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.body}</p>
              {q.image_url && <img loading="lazy" decoding="async" src={q.image_url} alt="" className="rounded-md max-h-60 object-cover" />}
              {q.answer && (
                <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-1">Respuesta del maestro</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
