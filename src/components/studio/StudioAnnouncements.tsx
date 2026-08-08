import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Plus, Trash2, Megaphone, Users, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useStudioAnnouncements,
  useSaveStudioAnnouncement,
  useDeleteStudioAnnouncement,
  useStudioStudents,
  useUpdateTeacherAccount,
  type TeacherAccount,
} from '@/hooks/useTeacherStudio';

export const StudioAnnouncements = ({ account }: { account: TeacherAccount }) => {
  const { data: announcements = [], isLoading } = useStudioAnnouncements(account.id);
  const { data: students = [] } = useStudioStudents(account.id);
  const save = useSaveStudioAnnouncement();
  const remove = useDeleteStudioAnnouncement();
  const updateAccount = useUpdateTeacherAccount();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    link: '',
    audience: 'all',
    teacher_student_id: '',
  });

  const activeStudents = students.filter((s) => s.status === 'active');

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: 'Falta título o mensaje', variant: 'destructive' });
      return;
    }
    if (form.audience === 'student' && !form.teacher_student_id) {
      toast({ title: 'Selecciona un alumno', variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync({
        teacher_account_id: account.id,
        title: form.title.trim(),
        body: form.body.trim(),
        link: form.link || null,
        audience: form.audience,
        teacher_student_id: form.audience === 'student' ? form.teacher_student_id : null,
      });
      toast({
        title: 'Aviso publicado',
        description:
          form.audience === 'all'
            ? `Visible para tus ${activeStudents.length} alumnos activos.`
            : 'Visible solo para el alumno seleccionado.',
      });
      setForm({ title: '', body: '', link: '', audience: 'all', teacher_student_id: '' });
      setOpen(false);
    } catch (e) {
      toast({
        title: 'No se pudo publicar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  const toggle = async (field: 'notify_new_class' | 'notify_new_assignment' | 'notify_class_reminder', value: boolean) => {
    try {
      await updateAccount.mutateAsync({ id: account.id, [field]: value });
    } catch (e) {
      toast({
        title: 'No se pudo actualizar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  const prefs = [
    {
      key: 'notify_new_class' as const,
      label: 'Avisar cuando programe una clase en vivo',
      value: account.notify_new_class,
    },
    {
      key: 'notify_new_assignment' as const,
      label: 'Avisar cuando asigne una tarea',
      value: account.notify_new_assignment,
    },
    {
      key: 'notify_class_reminder' as const,
      label: 'Recordatorio el día de la clase',
      value: account.notify_class_reminder,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Avisos a mis alumnos</h2>
          <p className="text-xs text-muted-foreground">
            Publica avisos que tus alumnos verán en su portal al entrar.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo aviso</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Cambio de horario esta semana"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mensaje</Label>
                <Textarea
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Escribe el aviso para tus alumnos…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Enlace (opcional)</Label>
                <Input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Destinatarios</Label>
                <select
                  className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                >
                  <option value="all">Todos mis alumnos</option>
                  <option value="student">Un alumno en particular</option>
                </select>
              </div>
              {form.audience === 'student' && (
                <div className="space-y-1.5">
                  <Label>Alumno</Label>
                  <select
                    className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
                    value={form.teacher_student_id}
                    onChange={(e) => setForm({ ...form, teacher_student_id: e.target.value })}
                  >
                    <option value="">Selecciona…</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} · {s.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Button className="w-full" onClick={submit} disabled={save.isPending}>
                Publicar aviso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 bg-card/70 border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Área de notificaciones</h3>
        </div>
        {prefs.map((p) => (
          <div key={p.key} className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{p.label}</p>
            <Switch checked={p.value} onCheckedChange={(v) => toggle(p.key, v)} />
          </div>
        ))}
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando avisos…</p>
      ) : announcements.length === 0 ? (
        <Card className="p-6 text-center bg-card/70 border-white/10">
          <Megaphone className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Todavía no has publicado avisos. Usa esta sección para horarios, recordatorios y tareas.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const target = students.find((s) => s.id === a.teacher_student_id);
            return (
              <Card key={a.id} className="p-4 bg-card/70 border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground truncate">{a.title}</h4>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {a.audience === 'all' ? (
                          <>
                            <Users className="w-3 h-3" /> Todos
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3" /> {target?.full_name ?? 'Alumno'}
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{a.body}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-2">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive shrink-0"
                    onClick={async () => {
                      if (!confirm('¿Eliminar este aviso?')) return;
                      await remove.mutateAsync(a.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
