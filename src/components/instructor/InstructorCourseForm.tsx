import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateInstructorCourse, useUpdateInstructorCourse, type InstructorCourse } from '@/hooks/useInstructorCourses';
import { useInstructorProfile } from '@/hooks/useInstructorData';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface InstructorCourseFormProps {
  open: boolean;
  onClose: () => void;
  course?: InstructorCourse | null;
}

const instrumentLabels: Record<string, string> = {
  guitar: '🎸 Guitarra',
  piano: '🎹 Piano',
  drums: '🥁 Batería',
};

const levels = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

const plans = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'pro', label: 'Pro' },
];

export const InstructorCourseForm = ({ open, onClose, course }: InstructorCourseFormProps) => {
  const { data: profile } = useInstructorProfile();
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [level, setLevel] = useState<string>(course?.level || 'beginner');
  const [requiredPlan, setRequiredPlan] = useState<string>(course?.required_plan || 'basic');
  const [durationHours, setDurationHours] = useState(course?.duration_hours?.toString() || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url || '');
  const [isPublished, setIsPublished] = useState(course?.is_published || false);

  const createCourse = useCreateInstructorCourse();
  const updateCourse = useUpdateInstructorCourse();
  const { toast } = useToast();

  // Reset form when course changes
  useEffect(() => {
    setTitle(course?.title || '');
    setDescription(course?.description || '');
    setLevel(course?.level || 'beginner');
    setRequiredPlan(course?.required_plan || 'basic');
    setDurationHours(course?.duration_hours?.toString() || '');
    setThumbnailUrl(course?.thumbnail_url || '');
    setIsPublished(course?.is_published || false);
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({ title: 'El título es requerido', variant: 'destructive' });
      return;
    }

    const courseData = {
      title: title.trim(),
      description: description.trim() || undefined,
      level: level as 'beginner' | 'intermediate' | 'advanced',
      required_plan: requiredPlan as 'basic' | 'standard' | 'pro',
      duration_hours: durationHours ? parseInt(durationHours) : null,
      thumbnail_url: thumbnailUrl || null,
      is_published: isPublished,
    };

    try {
      if (course) {
        await updateCourse.mutateAsync({ id: course.id, ...courseData });
        toast({ title: 'Curso actualizado exitosamente' });
      } else {
        await createCourse.mutateAsync(courseData);
        toast({ title: 'Curso creado exitosamente' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ title: 'Error al guardar el curso', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? 'Editar Curso' : 'Nuevo Curso'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Curso de ${instrumentLabels[profile?.instrument || 'guitar']?.replace(/[🎸🎹🥁🪕]\s/, '')}`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el contenido y objetivos del curso..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Instrumento</Label>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              {instrumentLabels[profile?.instrument || 'guitar']}
              <span className="text-muted-foreground ml-2">(asignado automáticamente)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plan Requerido</Label>
              <Select value={requiredPlan} onValueChange={setRequiredPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración estimada (horas)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              placeholder="10"
            />
          </div>

          <div className="space-y-2">
            <Label>Imagen del Curso</Label>
            <ImageUploader
              value={thumbnailUrl}
              onChange={setThumbnailUrl}
              folder="thumbnails"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="published" className="cursor-pointer">Publicar curso</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Los cursos publicados son visibles para los alumnos
              </p>
            </div>
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={createCourse.isPending || updateCourse.isPending}
            >
              {createCourse.isPending || updateCourse.isPending ? 'Guardando...' : course ? 'Guardar Cambios' : 'Crear Curso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
