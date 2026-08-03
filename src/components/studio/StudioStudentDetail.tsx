import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, ClipboardList, Video, FileText, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';
import {
  useStudioCourses,
  useStudioAllLessons,
  useStudioProgressRows,
  useStudioAssignments,
  useSaveStudioAssignment,
  type TeacherAccount,
  type StudioStudent,
} from '@/hooks/useTeacherStudio';

const KINDS = [
  { key: 'task', label: 'Tarea', icon: ClipboardList },
  { key: 'live_class', label: 'Clase en vivo', icon: Video },
  { key: 'material', label: 'Material', icon: FileText },
] as const;

export const StudioStudentDetail = ({
  account,
  student,
  open,
  onOpenChange,
}: {
  account: TeacherAccount;
  student: StudioStudent | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const { data: courses = [] } = useStudioCourses(account.id);
  const { data: lessons = [] } = useStudioAllLessons(account.id);
  const { data: progress = [] } = useStudioProgressRows(account.id);
  const { data: assignments = [] } = useStudioAssignments(account.id);
  const save = useSaveStudioAssignment();

  const [kind, setKind] = useState<(typeof KINDS)[number]['key']>('task');
  const [form, setForm] = useState({ title: '', instructions: '', link: '', due_at: '' });

  const completedLessonIds = useMemo(
    () =>
      new Set(
        progress
          .filter((p) => p.completed && student?.student_user_id && p.student_user_id === student.student_user_id)
          .map((p) => p.teacher_lesson_id),
      ),
    [progress, student?.student_user_id],
  );

  const perCourse = useMemo(
    () =>
      courses.map((c) => {
        const cl = lessons.filter((l) => l.teacher_course_id === c.id);
        const done = cl.filter((l) => completedLessonIds.has(l.id)).length;
        return { id: c.id, title: c.title, total: cl.length, done, pct: cl.length ? Math.round((done / cl.length) * 100) : 0 };
      }),
    [courses, lessons, completedLessonIds],
  );

  const myAssignments = assignments.filter((a) => a.teacher_student_id === student?.id);

  const submit = async () => {
    if (!student) return;
    if (!form.title.trim()) {
      toast({ title: 'Escribe un título', variant: 'destructive' });
      return;
    }
    const instructions = [form.instructions.trim(), form.link.trim() ? `Enlace: ${form.link.trim()}` : '']
      .filter(Boolean)
      .join('\n\n');
    try {
      await save.mutateAsync({
        teacher_account_id: account.id,
        teacher_student_id: student.id,
        title: form.title.trim(),
        instructions: instructions || null,
        tool_key: kind === 'task' ? null : kind,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      });
      toast({ title: kind === 'live_class' ? 'Clase en vivo asignada' : kind === 'material' ? 'Material asignado' : 'Tarea asignada' });
      setForm({ title: '', instructions: '', link: '', due_at: '' });
    } catch (e) {
      toast({ title: 'No se pudo asignar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate">{student.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{student.email}</Badge>
            <Badge variant="outline">
              {INSTRUMENT_PLANS.find((i) => i.id === student.instrument)?.label ?? 'Sin instrumento'}
            </Badge>
            <Badge variant="outline">{student.level ?? 'sin nivel'}</Badge>
          </div>

          {/* Progreso por curso */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Progreso por curso</h3>
            {!student.student_user_id && (
              <p className="text-xs text-muted-foreground">
                Este alumno aún no activa su acceso con el enlace de invitación, por eso no hay progreso.
              </p>
            )}
            {perCourse.length === 0 ? (
              <p className="text-xs text-muted-foreground">Todavía no tienes cursos creados.</p>
            ) : (
              perCourse.map((c) => (
                <Card key={c.id} className="p-3 bg-card/70 border-white/10 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-medium truncate">{c.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {c.done}/{c.total} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${c.pct}%` }} />
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Tareas y asignaciones */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Asignaciones ({myAssignments.length})</h3>
            {myAssignments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin asignaciones todavía.</p>
            ) : (
              <div className="space-y-2">
                {myAssignments.map((a) => (
                  <Card key={a.id} className="p-3 bg-card/70 border-white/10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{a.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {KINDS.find((k) => k.key === a.tool_key)?.label ?? 'Tarea'}
                          {a.due_at ? ` · vence ${new Date(a.due_at).toLocaleDateString('es-MX')}` : ''}
                        </p>
                      </div>
                      <Badge variant={a.status === 'pending' ? 'secondary' : 'default'} className="shrink-0">
                        {a.status === 'pending' ? 'Pendiente' : a.status === 'completed' ? 'Completada' : 'Revisada'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Asignar algo nuevo */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-foreground">Asignar a este alumno</h3>
            <div className="grid grid-cols-3 gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.key}
                  onClick={() => setKind(k.key)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] transition-colors ${
                    kind === k.key
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-white/10 bg-white/[0.03] text-muted-foreground'
                  }`}
                >
                  <k.icon className="w-4 h-4" />
                  {k.label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={
                  kind === 'live_class' ? 'Clase en vivo: técnica de escalas' : kind === 'material' ? 'PDF de acordes básicos' : 'Rutina de práctica'
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{kind === 'task' ? 'Instrucciones' : 'Detalles'}</Label>
              <Textarea rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>
            {kind !== 'task' && (
              <div className="space-y-1.5">
                <Label>{kind === 'live_class' ? 'Enlace de la clase (Zoom/Meet)' : 'Enlace del material'}</Label>
                <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{kind === 'live_class' ? 'Fecha de la clase' : 'Fecha límite'}</Label>
              <Input type="date" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
            </div>
            <Button className="w-full gap-2" onClick={submit} disabled={save.isPending}>
              {kind === 'task' ? <Plus className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              Asignar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
