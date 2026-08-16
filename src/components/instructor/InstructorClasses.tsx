import { useState } from 'react';
import { Video, Plus, Calendar, Users, Trash2, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstructorProfile } from '@/hooks/useInstructorData';
import {
  useInstructorLiveClasses,
  useCreateInstructorLiveClass,
  useDeleteInstructorLiveClass,
} from '@/hooks/useInstructorContent';
import { instrumentLabel } from '@/lib/instruments';
import { useToast } from '@/hooks/use-toast';

const plans = [
  { value: 'basic', label: 'Esencial' },
  { value: 'standard', label: 'Pro' },
  { value: 'pro', label: 'Premium' },
];

export const InstructorClasses = () => {
  const { data: profile } = useInstructorProfile();
  const { data: classes, isLoading } = useInstructorLiveClasses();
  const createClass = useCreateInstructorLiveClass();
  const deleteClass = useDeleteInstructorLiveClass();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxAttendees, setMaxAttendees] = useState('30');
  const [zoomUrl, setZoomUrl] = useState('');
  const [requiredPlan, setRequiredPlan] = useState('basic');

  const label = instrumentLabel(profile?.instrument) || 'tu instrumento';

  const reset = () => {
    setTitle('');
    setDescription('');
    setScheduledAt('');
    setDuration('60');
    setMaxAttendees('30');
    setZoomUrl('');
    setRequiredPlan('basic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) {
      toast({ title: 'Completa título y fecha', variant: 'destructive' });
      return;
    }
    try {
      await createClass.mutateAsync({
        title: title.trim(),
        description: description || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parseInt(duration) || 60,
        max_attendees: parseInt(maxAttendees) || 30,
        zoom_join_url: zoomUrl || null,
        required_plan: requiredPlan as 'basic' | 'standard' | 'pro',
      });
      toast({ title: 'Clase programada', description: 'Tus alumnos ya la pueden ver en su portal.' });
      reset();
      setOpen(false);
    } catch (err) {
      toast({ title: 'No se pudo programar la clase', variant: 'destructive' });
    }
  };

  const now = Date.now();
  const upcoming = (classes ?? []).filter((c) => new Date(c.scheduled_at).getTime() >= now);
  const past = (classes ?? []).filter((c) => new Date(c.scheduled_at).getTime() < now);

  const renderClass = (c: NonNullable<typeof classes>[number]) => (
    <Card key={c.id} className="border-border/50">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Video className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{c.title}</h3>
            <Badge variant="outline">{plans.find((p) => p.value === c.required_plan)?.label ?? c.required_plan}</Badge>
          </div>
          {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(c.scheduled_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {c.duration_minutes ?? 60} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {c.max_attendees ?? 30} cupos
            </span>
          </div>
          {c.zoom_join_url && (
            <a
              href={c.zoom_join_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              Abrir sala
            </a>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={async () => {
            try {
              await deleteClass.mutateAsync(c.id);
              toast({ title: 'Clase eliminada' });
            } catch {
              toast({ title: 'No se pudo eliminar', variant: 'destructive' });
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Clases en Vivo</h2>
          <p className="text-muted-foreground text-sm">Programa y gestiona tus clases de {label}</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Programar
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando clases…</div>
      ) : (classes ?? []).length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No tienes clases programadas</h3>
            <p className="text-muted-foreground mb-4">
              Programa una clase en vivo para tus alumnos de {label}
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Programar mi primera clase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Próximas</h3>
              {upcoming.map(renderClass)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Anteriores</h3>
              {past.map(renderClass)}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programar clase en vivo</DialogTitle>
            <DialogDescription>Clase de {label}. Pega el link de Zoom o Meet de tu sala.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ic-title">Título</Label>
              <Input id="ic-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clase grupal: ritmos básicos" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ic-desc">Descripción</Label>
              <Textarea id="ic-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ic-date">Fecha y hora</Label>
              <Input id="ic-date" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ic-dur">Duración (min)</Label>
                <Input id="ic-dur" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ic-max">Cupos</Label>
                <Input id="ic-max" type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plan requerido</Label>
              <Select value={requiredPlan} onValueChange={setRequiredPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ic-zoom">Link de la sala (Zoom / Meet)</Label>
              <Input id="ic-zoom" value={zoomUrl} onChange={(e) => setZoomUrl(e.target.value)} placeholder="https://zoom.us/j/…" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createClass.isPending}>
                {createClass.isPending ? 'Guardando…' : 'Programar clase'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
