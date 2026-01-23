import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateModule, useCreateLesson } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';
import { VideoUploader } from './VideoUploader';

interface ModuleLessonFormProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  moduleId?: string;
}

export const ModuleLessonForm = ({ open, onClose, courseId, moduleId }: ModuleLessonFormProps) => {
  const [tab, setTab] = useState<string>(moduleId ? 'lesson' : 'module');
  
  // Module state
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleSortOrder, setModuleSortOrder] = useState('0');

  // Lesson state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [lessonSortOrder, setLessonSortOrder] = useState('0');
  const [isFreePreview, setIsFreePreview] = useState(false);

  const createModule = useCreateModule();
  const createLesson = useCreateLesson();
  const { toast } = useToast();

  const resetForm = () => {
    setModuleTitle('');
    setModuleDescription('');
    setModuleSortOrder('0');
    setLessonTitle('');
    setLessonDescription('');
    setLessonVideoUrl('');
    setLessonDuration('');
    setLessonSortOrder('0');
    setIsFreePreview(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createModule.mutateAsync({
        course_id: courseId,
        title: moduleTitle,
        description: moduleDescription || null,
        sort_order: parseInt(moduleSortOrder) || 0,
      });
      toast({ title: 'Módulo creado exitosamente' });
      handleClose();
    } catch (error) {
      toast({ title: 'Error al crear el módulo', variant: 'destructive' });
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleId) {
      toast({ title: 'Selecciona un módulo primero', variant: 'destructive' });
      return;
    }

    try {
      await createLesson.mutateAsync({
        module_id: moduleId,
        title: lessonTitle,
        description: lessonDescription || null,
        video_url: lessonVideoUrl || null,
        duration_minutes: lessonDuration ? parseInt(lessonDuration) : null,
        sort_order: parseInt(lessonSortOrder) || 0,
        is_free_preview: isFreePreview,
      });
      toast({ title: 'Lección creada exitosamente' });
      handleClose();
    } catch (error) {
      toast({ title: 'Error al crear la lección', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Contenido</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="module">Módulo</TabsTrigger>
            <TabsTrigger value="lesson" disabled={!moduleId}>Lección</TabsTrigger>
          </TabsList>

          <TabsContent value="module">
            <form onSubmit={handleCreateModule} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="module-title">Título del Módulo</Label>
                <Input
                  id="module-title"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Introducción a los acordes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module-desc">Descripción</Label>
                <Textarea
                  id="module-desc"
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  placeholder="Descripción del módulo..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module-order">Orden</Label>
                <Input
                  id="module-order"
                  type="number"
                  value={moduleSortOrder}
                  onChange={(e) => setModuleSortOrder(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={createModule.isPending}>
                  Crear Módulo
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="lesson">
            <form onSubmit={handleCreateLesson} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Título de la Lección</Label>
                <Input
                  id="lesson-title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Acorde de Do Mayor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-desc">Descripción</Label>
                <Textarea
                  id="lesson-desc"
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  placeholder="Descripción de la lección..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Video de la Lección</Label>
                <VideoUploader
                  value={lessonVideoUrl}
                  onChange={setLessonVideoUrl}
                  folder="lessons"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-duration">Duración (min)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    placeholder="15"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-order">Orden</Label>
                  <Input
                    id="lesson-order"
                    type="number"
                    value={lessonSortOrder}
                    onChange={(e) => setLessonSortOrder(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="free-preview">Vista previa gratuita</Label>
                <Switch
                  id="free-preview"
                  checked={isFreePreview}
                  onCheckedChange={setIsFreePreview}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={createLesson.isPending}>
                  Crear Lección
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
