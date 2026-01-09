import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateCourse, useUpdateCourse } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

interface CourseFormProps {
  open: boolean;
  onClose: () => void;
  course?: Tables<'courses'> | null;
}

const instruments = [
  { value: 'guitar', label: '🎸 Guitarra' },
  { value: 'piano', label: '🎹 Piano' },
  { value: 'drums', label: '🥁 Batería' },
  { value: 'banjo', label: '🪕 Banjo' },
];

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

export const CourseForm = ({ open, onClose, course }: CourseFormProps) => {
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [instrument, setInstrument] = useState<string>(course?.instrument || 'guitar');
  const [level, setLevel] = useState<string>(course?.level || 'beginner');
  const [requiredPlan, setRequiredPlan] = useState<string>(course?.required_plan || 'basic');
  const [durationHours, setDurationHours] = useState(course?.duration_hours?.toString() || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url || '');
  const [isPublished, setIsPublished] = useState(course?.is_published || false);

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const courseData = {
      title,
      description,
      instrument: instrument as 'guitar' | 'piano' | 'drums' | 'banjo',
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
      toast({ title: 'Error al guardar el curso', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
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
              placeholder="Guitarra para principiantes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del curso..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instrumento</Label>
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="duration">Duración (horas)</Label>
              <Input
                id="duration"
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">URL de Imagen</Label>
            <Input
              id="thumbnail"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="published">Publicado</Label>
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
            <Button type="submit" className="flex-1" disabled={createCourse.isPending || updateCourse.isPending}>
              {course ? 'Guardar Cambios' : 'Crear Curso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
