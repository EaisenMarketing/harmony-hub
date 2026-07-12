import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VideoUploader } from './VideoUploader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type InstrumentType = Database['public']['Enums']['instrument_type'];

interface VideoUploadFormProps {
  open: boolean;
  onClose: () => void;
}

const instrumentLabels: Record<InstrumentType, string> = {
  guitar: '🎸 Guitarra',
  piano: '🎹 Piano',
  drums: '🥁 Batería',
};

export const VideoUploadForm = ({ open, onClose }: VideoUploadFormProps) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses-for-upload'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, instrument')
        .order('title', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch modules for selected course
  const { data: modules = [] } = useQuery({
    queryKey: ['course-modules-for-upload', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      
      const { data, error } = await supabase
        .from('course_modules')
        .select('id, title, sort_order')
        .eq('course_id', selectedCourseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourseId,
  });

  // Reset module when course changes
  useEffect(() => {
    setSelectedModuleId('');
  }, [selectedCourseId]);

  // Get next sort order for lessons
  const { data: nextSortOrder = 0 } = useQuery({
    queryKey: ['next-lesson-order', selectedModuleId],
    queryFn: async () => {
      if (!selectedModuleId) return 0;
      
      const { data, error } = await supabase
        .from('lessons')
        .select('sort_order')
        .eq('module_id', selectedModuleId)
        .order('sort_order', { ascending: false })
        .limit(1);

      if (error) throw error;
      return (data?.[0]?.sort_order ?? 0) + 1;
    },
    enabled: !!selectedModuleId,
  });

  // Create lesson mutation
  const createLesson = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          module_id: selectedModuleId,
          title: lessonTitle,
          description: lessonDescription || null,
          video_url: videoUrl,
          duration_minutes: durationMinutes || null,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-video-library'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-modules'] });
      toast({ title: 'Video subido y lección creada exitosamente' });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al crear la lección',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setSelectedCourseId('');
    setSelectedModuleId('');
    setLessonTitle('');
    setLessonDescription('');
    setDurationMinutes(0);
    setVideoUrl('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourseId || !selectedModuleId || !lessonTitle || !videoUrl) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    createLesson.mutate();
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">Curso *</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger id="course">
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {instrumentLabels[course.instrument as InstrumentType]} {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {courses.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay cursos disponibles. Crea un curso primero.
              </p>
            )}
          </div>

          {/* Module Selection */}
          {selectedCourseId && (
            <div className="space-y-2">
              <Label htmlFor="module">Módulo *</Label>
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                <SelectTrigger id="module">
                  <SelectValue placeholder="Selecciona un módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {modules.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Este curso no tiene módulos. Crea un módulo primero en la sección de cursos.
                </p>
              )}
            </div>
          )}

          {/* Lesson Details */}
          {selectedModuleId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Lección *</Label>
                <Input
                  id="title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Ej: Introducción a los acordes básicos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  placeholder="Describe brevemente el contenido de esta lección..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={durationMinutes || ''}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  placeholder="15"
                />
              </div>

              <div className="space-y-2">
                <Label>Video *</Label>
                <VideoUploader
                  value={videoUrl}
                  onChange={setVideoUrl}
                  folder={`videos/${selectedCourse?.instrument || 'general'}`}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedCourseId || !selectedModuleId || !lessonTitle || !videoUrl || createLesson.isPending}
            >
              {createLesson.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Lección con Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
