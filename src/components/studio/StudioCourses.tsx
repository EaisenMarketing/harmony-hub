import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Video, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';
import { VideoUploader } from '@/components/admin/VideoUploader';
import {
  useStudioCourses,
  useSaveStudioCourse,
  useDeleteStudioCourse,
  useStudioLessons,
  useSaveStudioLesson,
  useDeleteStudioLesson,
  type TeacherAccount,
  type StudioCourse,
  type StudioLesson,
} from '@/hooks/useTeacherStudio';

const LEVELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const LessonsView = ({ account, course, onBack }: { account: TeacherAccount; course: StudioCourse; onBack: () => void }) => {
  const { data: lessons = [], isLoading } = useStudioLessons(course.id);
  const save = useSaveStudioLesson();
  const remove = useDeleteStudioLesson();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudioLesson | null>(null);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', attachment_url: '', duration_minutes: 15 });

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', video_url: '', attachment_url: '', duration_minutes: 15 });
    setOpen(true);
  };

  const openEdit = (l: StudioLesson) => {
    setEditing(l);
    setForm({
      title: l.title,
      description: l.description ?? '',
      video_url: l.video_url ?? '',
      attachment_url: l.attachment_url ?? '',
      duration_minutes: l.duration_minutes,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Ponle título a la lección', variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync({
        id: editing?.id,
        teacher_account_id: account.id,
        teacher_course_id: course.id,
        title: form.title.trim(),
        description: form.description || null,
        video_url: form.video_url || null,
        attachment_url: form.attachment_url || null,
        duration_minutes: Number(form.duration_minutes) || 0,
        sort_order: editing?.sort_order ?? lessons.length,
      });
      toast({ title: editing ? 'Lección actualizada' : 'Lección creada' });
      setOpen(false);
    } catch (e) {
      toast({ title: 'No se pudo guardar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Cursos
        </Button>
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva lección
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground">{course.title}</h2>
        <p className="text-xs text-muted-foreground">{lessons.length} lecciones</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : lessons.length === 0 ? (
        <Card className="p-6 text-center bg-card/70 border-white/10">
          <Video className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Agrega tu primera lección: sube el video desde tu computadora o pega un enlace de YouTube/Vimeo.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((l, idx) => (
            <Card key={l.id} className="p-3 bg-card/70 border-white/10 flex items-center gap-3">
              <span className="w-7 h-7 shrink-0 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {l.duration_minutes} min {l.video_url ? '· video' : '· sin video'}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  if (confirm('¿Eliminar esta lección?')) remove.mutate(l.id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar lección' : 'Nueva lección'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Video de la lección</Label>
              <VideoUploader
                value={form.video_url}
                onChange={(url) => setForm({ ...form, video_url: url })}
                folder={`estudios/${account.id}`}
              />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">…o pega un enlace (YouTube, Vimeo, Drive)</Label>
                <Input
                  placeholder="https://…"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Material adjunto (PDF/enlace)</Label>
              <Input value={form.attachment_url} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
              />
            </div>
            <Button className="w-full" onClick={submit} disabled={save.isPending}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const StudioCourses = ({ account }: { account: TeacherAccount }) => {
  const { data: courses = [], isLoading } = useStudioCourses(account.id);
  const save = useSaveStudioCourse();
  const remove = useDeleteStudioCourse();
  const [selected, setSelected] = useState<StudioCourse | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudioCourse | null>(null);
  const [form, setForm] = useState({ title: '', description: '', instrument: '', level: 'beginner', is_published: false });

  const current = selected ? courses.find((c) => c.id === selected.id) ?? selected : null;
  if (current) return <LessonsView account={account} course={current} onBack={() => setSelected(null)} />;

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', instrument: account.primary_instrument ?? '', level: 'beginner', is_published: false });
    setOpen(true);
  };

  const openEdit = (c: StudioCourse) => {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description ?? '',
      instrument: c.instrument ?? '',
      level: c.level,
      is_published: c.is_published,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Ponle título al curso', variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync({
        id: editing?.id,
        teacher_account_id: account.id,
        title: form.title.trim(),
        description: form.description || null,
        instrument: form.instrument || null,
        level: form.level,
        is_published: form.is_published,
        sort_order: editing?.sort_order ?? courses.length,
      });
      toast({ title: editing ? 'Curso actualizado' : 'Curso creado' });
      setOpen(false);
    } catch (e) {
      toast({ title: 'No se pudo guardar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-foreground">Mis cursos</h2>
          <p className="text-xs text-muted-foreground">Tu contenido, visible solo para tus alumnos.</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" />
          Nuevo curso
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : courses.length === 0 ? (
        <Card className="p-6 text-center bg-card/70 border-white/10">
          <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Crea tu primer curso y agrégale lecciones.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} className="p-4 bg-card/70 border-white/10 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground">{c.title}</p>
                <Badge variant={c.is_published ? 'default' : 'secondary'}>
                  {c.is_published ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{c.description || 'Sin descripción'}</p>
              <p className="text-[11px] text-muted-foreground/80">
                {INSTRUMENT_PLANS.find((i) => i.id === c.instrument)?.label ?? 'General'} · {LEVELS[c.level] ?? c.level}
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => setSelected(c)}>
                  Lecciones
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('¿Eliminar el curso y sus lecciones?')) remove.mutate(c.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar curso' : 'Nuevo curso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Instrumento</Label>
              <select
                className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
                value={form.instrument}
                onChange={(e) => setForm({ ...form, instrument: e.target.value })}
              >
                <option value="">General</option>
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
                {Object.entries(LEVELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Publicado</p>
                <p className="text-xs text-muted-foreground">Tus alumnos solo ven cursos publicados.</p>
              </div>
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
            </div>
            <Button className="w-full" onClick={submit} disabled={save.isPending}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
