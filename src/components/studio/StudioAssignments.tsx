import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, ClipboardList, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useStudioAssignments,
  useSaveStudioAssignment,
  useDeleteStudioAssignment,
  useStudioStudents,
  type TeacherAccount,
} from '@/hooks/useTeacherStudio';

const STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  completed: { label: 'Completada', variant: 'default' },
  reviewed: { label: 'Revisada', variant: 'outline' },
};

const TOOLS = [
  { key: '', label: 'Sin herramienta' },
  { key: 'practice_coach', label: 'Coach de práctica IA' },
  { key: 'ear_trainer', label: 'Entrenador de oído IA' },
  { key: 'metronome', label: 'Metrónomo / Afinador' },
  { key: 'chord_creator', label: 'Creador de acordes' },
  { key: 'song_analyzer', label: 'Analizador de canciones' },
  { key: 'practice_feedback', label: 'Feedback de práctica IA' },
];

export const StudioAssignments = ({ account }: { account: TeacherAccount }) => {
  const { data: assignments = [], isLoading } = useStudioAssignments(account.id);
  const { data: students = [] } = useStudioStudents(account.id);
  const save = useSaveStudioAssignment();
  const remove = useDeleteStudioAssignment();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ teacher_student_id: '', title: '', instructions: '', due_at: '', tool_key: '' });

  const studentName = (id: string) => students.find((s) => s.id === id)?.full_name ?? 'Alumno';

  const submit = async () => {
    if (!form.teacher_student_id || !form.title.trim()) {
      toast({ title: 'Elige un alumno y escribe el título', variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync({
        teacher_account_id: account.id,
        teacher_student_id: form.teacher_student_id,
        title: form.title.trim(),
        instructions: form.instructions || null,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
        tool_key: form.tool_key || null,
      });
      toast({ title: 'Tarea asignada' });
      setForm({ teacher_student_id: '', title: '', instructions: '', due_at: '', tool_key: '' });
      setOpen(false);
    } catch (e) {
      toast({ title: 'No se pudo asignar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-foreground">Tareas</h2>
          <p className="text-xs text-muted-foreground">Asigna rutinas y revisa el cumplimiento.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} disabled={students.length === 0}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva tarea
        </Button>
      </div>

      {students.length === 0 && (
        <Card className="p-4 bg-card/70 border-white/10 text-sm text-muted-foreground">
          Primero invita alumnos a tu estudio para poder asignarles tareas.
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : assignments.length === 0 ? (
        <Card className="p-6 text-center bg-card/70 border-white/10">
          <ClipboardList className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aún no has asignado tareas.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((a) => {
            const st = STATUS[a.status] ?? STATUS.pending;
            return (
              <Card key={a.id} className="p-4 bg-card/70 border-white/10 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{studentName(a.teacher_student_id)}</p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                {a.instructions && <p className="text-xs text-muted-foreground line-clamp-3">{a.instructions}</p>}
                {a.due_at && (
                  <p className="text-[11px] text-muted-foreground/80">
                    Vence: {new Date(a.due_at).toLocaleDateString('es-MX')}
                  </p>
                )}
                {a.student_notes && (
                  <p className="text-xs text-foreground/80 italic border-l-2 border-primary/40 pl-2">
                    “{a.student_notes}”
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  {a.status !== 'reviewed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        save.mutate({
                          id: a.id,
                          teacher_account_id: account.id,
                          teacher_student_id: a.teacher_student_id,
                          title: a.title,
                          status: 'reviewed',
                        })
                      }
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Marcar revisada
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm('¿Eliminar esta tarea?')) remove.mutate(a.id);
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Instrucciones</Label>
              <Textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Herramienta sugerida</Label>
              <select
                className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
                value={form.tool_key}
                onChange={(e) => setForm({ ...form, tool_key: e.target.value })}
              >
                {TOOLS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha límite</Label>
              <Input type="date" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
            </div>
            <Button className="w-full" onClick={submit} disabled={save.isPending}>
              Asignar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
