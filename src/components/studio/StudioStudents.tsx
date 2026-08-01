import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Search, Trash2, Pencil, Copy, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';
import { studioInviteUrl, TEACHER_STUDENT_STATUS_LABEL } from '@/lib/teacher-plans';
import {
  useStudioStudents,
  useSaveStudioStudent,
  useDeleteStudioStudent,
  useStudioStudentProgress,
  type TeacherAccount,
  type StudioStudent,
} from '@/hooks/useTeacherStudio';

const emptyForm = { full_name: '', email: '', phone: '', instrument: '', level: 'beginner', notes: '' };

export const StudioStudents = ({ account }: { account: TeacherAccount }) => {
  const { data: students = [], isLoading } = useStudioStudents(account.id);
  const { data: progress } = useStudioStudentProgress(account.id);
  const save = useSaveStudioStudent();
  const remove = useDeleteStudioStudent();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudioStudent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [q, setQ] = useState('');

  const seatsUsed = students.filter((s) => s.status !== 'inactive').length;
  const seatsFull = seatsUsed >= account.seat_limit;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return students;
    return students.filter(
      (s) => s.full_name.toLowerCase().includes(t) || s.email.toLowerCase().includes(t),
    );
  }, [students, q]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, instrument: account.primary_instrument ?? '' });
    setOpen(true);
  };

  const openEdit = (s: StudioStudent) => {
    setEditing(s);
    setForm({
      full_name: s.full_name,
      email: s.email,
      phone: s.phone ?? '',
      instrument: s.instrument ?? '',
      level: s.level ?? 'beginner',
      notes: s.notes ?? '',
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: 'Falta nombre o email', variant: 'destructive' });
      return;
    }
    if (!editing && seatsFull) {
      toast({
        title: 'Sin cupos disponibles',
        description: 'Sube de plan para agregar más alumnos.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await save.mutateAsync({
        id: editing?.id,
        teacher_account_id: account.id,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || null,
        instrument: form.instrument || null,
        level: form.level,
        notes: form.notes || null,
      });
      toast({
        title: editing ? 'Alumno actualizado' : 'Alumno invitado',
        description: editing ? undefined : 'Compártele tu enlace de invitación para que active su acceso.',
      });
      setOpen(false);
    } catch (e) {
      toast({
        title: 'No se pudo guardar',
        description: e instanceof Error ? e.message : 'Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const copyInvite = async () => {
    const url = studioInviteUrl(account.invite_code);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Enlace copiado', description: url });
    } catch {
      toast({ title: 'Copia manualmente', description: url });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Mis alumnos</h2>
          <p className="text-xs text-muted-foreground">
            {seatsUsed} de {account.seat_limit} cupos usados
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyInvite}>
            <Copy className="w-4 h-4 mr-2" />
            Enlace
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew} disabled={seatsFull}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invitar alumno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar alumno' : 'Invitar alumno'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nombre completo</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono (opcional)</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Instrumento</Label>
                  <select
                    className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
                    value={form.instrument}
                    onChange={(e) => setForm({ ...form, instrument: e.target.value })}
                  >
                    <option value="">Sin definir</option>
                    {INSTRUMENT_PLANS.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nivel</Label>
                  <select
                    className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Notas privadas</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={submit} disabled={save.isPending}>
                  {editing ? 'Guardar cambios' : 'Invitar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nombre o email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando alumnos…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center bg-card/70 border-white/10">
          <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Aún no tienes alumnos. Invítalos por email o comparte tu enlace de invitación.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const p = s.student_user_id ? progress?.get(s.student_user_id) : undefined;
            return (
              <Card key={s.id} className="p-4 bg-card/70 border-white/10 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                  <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>
                    {TEACHER_STUDENT_STATUS_LABEL[s.status]}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    Instrumento:{' '}
                    {INSTRUMENT_PLANS.find((i) => i.id === s.instrument)?.label ?? 'Sin definir'}
                  </p>
                  <p>Lecciones completadas: {p?.completed ?? 0}</p>
                  {p?.last && <p>Última actividad: {new Date(p.last).toLocaleDateString('es-MX')}</p>}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`¿Quitar a ${s.full_name} de tu estudio?`)) remove.mutate(s.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
