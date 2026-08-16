import { useState } from 'react';
import { Plus, Trash2, Video, Layers, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoUploader } from '@/components/admin/VideoUploader';
import { useToast } from '@/hooks/use-toast';
import {
  useCourseContent,
  useCreateModule,
  useDeleteModule,
  useCreateLesson,
  useDeleteLesson,
  type ModuleWithLessons,
} from '@/hooks/useInstructorContent';

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

export const InstructorCourseContent = ({ open, onClose, courseId, courseTitle }: Props) => {
  const { data: modules, isLoading } = useCourseContent(open ? courseId : undefined);
  const createModule = useCreateModule();
  const deleteModule = useDeleteModule();
  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();
  const { toast } = useToast();

  const [moduleTitle, setModuleTitle] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lessonFor, setLessonFor] = useState<string | null>(null);

  // lesson draft
  const [lTitle, setLTitle] = useState('');
  const [lDesc, setLDesc] = useState('');
  const [lVideo, setLVideo] = useState('');
  const [lDuration, setLDuration] = useState('');
  const [lFree, setLFree] = useState(false);

  const resetLesson = () => {
    setLTitle('');
    setLDesc('');
    setLVideo('');
    setLDuration('');
    setLFree(false);
    setLessonFor(null);
  };

  const handleAddModule = async () => {
    if (!moduleTitle.trim()) return;
    try {
      await createModule.mutateAsync({
        course_id: courseId,
        title: moduleTitle.trim(),
        sort_order: (modules?.length ?? 0) + 1,
      });
      setModuleTitle('');
      toast({ title: 'Módulo creado' });
    } catch (e) {
      toast({ title: 'No se pudo crear el módulo', variant: 'destructive' });
    }
  };

  const handleAddLesson = async (module: ModuleWithLessons) => {
    if (!lTitle.trim()) {
      toast({ title: 'Ponle un título a la lección', variant: 'destructive' });
      return;
    }
    try {
      await createLesson.mutateAsync({
        module_id: module.id,
        title: lTitle.trim(),
        description: lDesc || null,
        video_url: lVideo || null,
        duration_minutes: lDuration ? parseInt(lDuration) : null,
        sort_order: module.lessons.length + 1,
        is_free_preview: lFree,
      });
      resetLesson();
      toast({ title: 'Lección publicada' });
    } catch (e) {
      toast({ title: 'No se pudo crear la lección', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contenido del curso</DialogTitle>
          <DialogDescription>{courseTitle}</DialogDescription>
        </DialogHeader>

        {/* Nuevo módulo */}
        <div className="flex gap-2">
          <Input
            placeholder="Nuevo módulo (ej. Acordes básicos)"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
          />
          <Button onClick={handleAddModule} disabled={createModule.isPending} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Módulo
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Cargando contenido…</div>
        ) : !modules || modules.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Crea tu primer módulo y luego sube los videos de tus clases.
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((m) => {
              const isOpen = expanded === m.id;
              return (
                <Card key={m.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      onClick={() => setExpanded(isOpen ? null : m.id)}
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-medium truncate">{m.title}</span>
                      <Badge variant="outline">{m.lessons.length} lecciones</Badge>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={async () => {
                        try {
                          await deleteModule.mutateAsync(m.id);
                          toast({ title: 'Módulo eliminado' });
                        } catch {
                          toast({ title: 'No se pudo eliminar', variant: 'destructive' });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 space-y-2 pl-6">
                      {m.lessons.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center gap-2 rounded-lg border border-border/50 p-2"
                        >
                          <Video className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{l.title}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                              {l.duration_minutes ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {l.duration_minutes} min
                                </span>
                              ) : null}
                              {l.video_url ? 'Video listo' : 'Sin video'}
                              {l.is_free_preview ? ' · Vista previa gratis' : ''}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={async () => {
                              try {
                                await deleteLesson.mutateAsync(l.id);
                                toast({ title: 'Lección eliminada' });
                              } catch {
                                toast({ title: 'No se pudo eliminar', variant: 'destructive' });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      {lessonFor === m.id ? (
                        <div className="space-y-3 rounded-lg border border-primary/30 p-3">
                          <div className="space-y-2">
                            <Label>Título de la lección</Label>
                            <Input value={lTitle} onChange={(e) => setLTitle(e.target.value)} placeholder="Clase 1: Postura y afinación" />
                          </div>
                          <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Textarea value={lDesc} onChange={(e) => setLDesc(e.target.value)} rows={2} />
                          </div>
                          <div className="space-y-2">
                            <Label>Video de la clase</Label>
                            <VideoUploader value={lVideo} onChange={setLVideo} folder={`instructor/${courseId}`} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Duración (min)</Label>
                              <Input type="number" value={lDuration} onChange={(e) => setLDuration(e.target.value)} placeholder="15" />
                            </div>
                            <div className="flex items-end gap-2 pb-2">
                              <Switch checked={lFree} onCheckedChange={setLFree} id="free-preview" />
                              <Label htmlFor="free-preview" className="text-xs">Vista previa gratis</Label>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleAddLesson(m)} disabled={createLesson.isPending}>
                              Guardar lección
                            </Button>
                            <Button variant="ghost" onClick={resetLesson}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => { resetLesson(); setLessonFor(m.id); }}>
                          <Plus className="w-4 h-4" />
                          Subir clase / lección
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
