import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Video,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Pencil,
  Users,
  Link2,
  CalendarClock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useStudioLiveClasses,
  useSaveStudioLiveClass,
  useDeleteStudioLiveClass,
  useStudioClassRegistrations,
  useUpdateTeacherAccount,
  type StudioLiveClass,
  type TeacherAccount,
} from '@/hooks/useTeacherStudio';
import { StudioClassRoom } from './StudioClassRoom';

const emptyForm = {
  id: '' as string,
  title: '',
  description: '',
  scheduled_at: '',
  duration_minutes: 60,
  join_url: '',
  meeting_id: '',
  passcode: '',
  recording_url: '',
  max_attendees: '' as string,
  is_published: true,
};

type FormState = typeof emptyForm;

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const StudioLiveClasses = ({ account }: { account: TeacherAccount }) => {
  const { data: classes = [], isLoading } = useStudioLiveClasses(account.id);
  const { data: registrations = [] } = useStudioClassRegistrations(account.id);
  const save = useSaveStudioLiveClass();
  const remove = useDeleteStudioLiveClass();
  const updateAccount = useUpdateTeacherAccount();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [room, setRoom] = useState<StudioLiveClass | null>(null);
  const [zoomRoom, setZoomRoom] = useState(account.zoom_room_url ?? '');
  const [zoomEmail, setZoomEmail] = useState(account.zoom_email ?? '');

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registrations) map.set(r.live_class_id, (map.get(r.live_class_id) ?? 0) + 1);
    return map;
  }, [registrations]);

  const now = Date.now();
  const upcoming = classes.filter((c) => new Date(c.scheduled_at).getTime() >= now - 60 * 60 * 1000);
  const past = classes
    .filter((c) => new Date(c.scheduled_at).getTime() < now - 60 * 60 * 1000)
    .reverse();

  const openNew = () => {
    setForm({ ...emptyForm, join_url: account.zoom_room_url ?? '' });
    setOpen(true);
  };

  const openEdit = (c: StudioLiveClass) => {
    setForm({
      id: c.id,
      title: c.title,
      description: c.description ?? '',
      scheduled_at: toLocalInput(c.scheduled_at),
      duration_minutes: c.duration_minutes ?? 60,
      join_url: c.join_url ?? '',
      meeting_id: c.meeting_id ?? '',
      passcode: c.passcode ?? '',
      recording_url: c.recording_url ?? '',
      max_attendees: c.max_attendees ? String(c.max_attendees) : '',
      is_published: c.is_published,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.scheduled_at) {
      toast({ title: 'Falta título o fecha', variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync({
        id: form.id || undefined,
        teacher_account_id: account.id,
        title: form.title.trim(),
        description: form.description || null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: Number(form.duration_minutes) || 60,
        join_url: form.join_url || null,
        meeting_id: form.meeting_id || null,
        passcode: form.passcode || null,
        recording_url: form.recording_url || null,
        max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
        is_published: form.is_published,
        instrument: account.primary_instrument,
      });
      toast({ title: form.id ? 'Clase actualizada' : 'Clase programada' });
      setOpen(false);
    } catch (e) {
      toast({
        title: 'No se pudo guardar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  const saveZoom = async () => {
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        zoom_room_url: zoomRoom.trim() || null,
        zoom_email: zoomEmail.trim() || null,
      });
      toast({
        title: 'Zoom conectado',
        description: 'Tus nuevas clases usarán esta sala por defecto.',
      });
    } catch (e) {
      toast({
        title: 'No se pudo guardar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Enlace copiado' });
    } catch {
      toast({ title: 'Copia manualmente', description: text });
    }
  };

  const ClassCard = ({ c, isPast }: { c: StudioLiveClass; isPast?: boolean }) => {
    const date = new Date(c.scheduled_at);
    const registered = counts.get(c.id) ?? 0;
    const live =
      Date.now() >= date.getTime() - 10 * 60 * 1000 &&
      Date.now() <= date.getTime() + (c.duration_minutes ?? 60) * 60 * 1000;

    return (
      <Card className="p-4 bg-card/70 border-white/10 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
            <span className="text-lg font-bold leading-none">{format(date, 'd')}</span>
            <span className="text-[10px] uppercase">{format(date, 'MMM', { locale: es })}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{c.title}</h3>
              {live && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">En vivo</Badge>}
              {!c.is_published && <Badge variant="secondary">Borrador</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(date, "EEEE d 'de' MMMM · HH:mm 'hrs'", { locale: es })} · {c.duration_minutes} min
            </p>
            {c.description && (
              <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{c.description}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {registered} inscrito{registered === 1 ? '' : 's'}
              {c.max_attendees ? ` / ${c.max_attendees}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {c.join_url && !isPast && (
            <Button size="sm" onClick={() => setRoom(c)}>
              <Video className="w-4 h-4 mr-2" />
              Entrar a la clase
            </Button>
          )}
          {c.join_url && (
            <Button size="sm" variant="outline" onClick={() => copy(c.join_url!)}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar enlace
            </Button>
          )}
          {c.recording_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={c.recording_url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Grabación
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              if (!confirm('¿Eliminar esta clase?')) return;
              await remove.mutateAsync(c.id);
              toast({ title: 'Clase eliminada' });
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Clases en vivo</h2>
          <p className="text-xs text-muted-foreground">
            Programa tus clases por Zoom y tus alumnos entran con un solo botón desde la plataforma.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva clase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Editar clase' : 'Programar clase en vivo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Clase grupal de guitarra – nivel 1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Qué van a trabajar en la clase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha y hora</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duración (min)</Label>
                  <Input
                    type="number"
                    min={15}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Enlace de Zoom</Label>
                <Input
                  value={form.join_url}
                  onChange={(e) => setForm({ ...form, join_url: e.target.value })}
                  placeholder="https://us02web.zoom.us/j/123456789?pwd=..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>ID de reunión</Label>
                  <Input
                    value={form.meeting_id}
                    onChange={(e) => setForm({ ...form, meeting_id: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Código de acceso</Label>
                  <Input
                    value={form.passcode}
                    onChange={(e) => setForm({ ...form, passcode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cupo máximo</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.max_attendees}
                    onChange={(e) => setForm({ ...form, max_attendees: e.target.value })}
                    placeholder="Sin límite"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Grabación (opcional)</Label>
                  <Input
                    value={form.recording_url}
                    onChange={(e) => setForm({ ...form, recording_url: e.target.value })}
                    placeholder="URL del video"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Visible para mis alumnos</p>
                  <p className="text-xs text-muted-foreground">Desactiva para guardarla como borrador.</p>
                </div>
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                />
              </div>
              <Button className="w-full" onClick={submit} disabled={save.isPending}>
                {form.id ? 'Guardar cambios' : 'Programar clase'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Conectar Zoom</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Pega tu sala personal de Zoom (Personal Meeting Room) o el enlace de tu licencia. Se usará como
          enlace por defecto en cada clase nueva.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Enlace de tu sala de Zoom</Label>
            <Input
              value={zoomRoom}
              onChange={(e) => setZoomRoom(e.target.value)}
              placeholder="https://us02web.zoom.us/j/1234567890"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email de tu cuenta Zoom</Label>
            <Input
              value={zoomEmail}
              onChange={(e) => setZoomEmail(e.target.value)}
              placeholder="maestro@correo.com"
            />
          </div>
        </div>
        <Button size="sm" onClick={saveZoom} disabled={updateAccount.isPending}>
          Guardar configuración de Zoom
        </Button>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando clases…</p>
      ) : (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Próximas ({upcoming.length})
            </h3>
            {upcoming.length === 0 ? (
              <Card className="p-6 text-center bg-card/70 border-white/10">
                <Video className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aún no tienes clases programadas. Crea la primera con tu enlace de Zoom.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {upcoming.map((c) => (
                  <ClassCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Anteriores ({past.length})</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {past.map((c) => (
                  <ClassCard key={c.id} c={c} isPast />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <StudioClassRoom liveClass={room} onClose={() => setRoom(null)} />
    </div>
  );
};
