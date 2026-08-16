import { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, Clock, Layers, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInstructorProfile } from '@/hooks/useInstructorData';
import { useInstructorCourses, useDeleteInstructorCourse, type InstructorCourse } from '@/hooks/useInstructorCourses';
import { InstructorCourseForm } from './InstructorCourseForm';
import { InstructorCourseContent } from './InstructorCourseContent';
import { instrumentLabel } from '@/lib/instruments';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const levelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const levelColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export const InstructorCourses = () => {
  const { data: profile } = useInstructorProfile();
  const { data: courses, isLoading } = useInstructorCourses();
  const deleteCourse = useDeleteInstructorCourse();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<InstructorCourse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<InstructorCourse | null>(null);
  const [contentCourse, setContentCourse] = useState<InstructorCourse | null>(null);

  const handleEdit = (course: InstructorCourse) => {
    setSelectedCourse(course);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedCourse(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (course: InstructorCourse) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    
    try {
      await deleteCourse.mutateAsync(courseToDelete.id);
      toast({ title: 'Curso eliminado exitosamente' });
    } catch (error) {
      toast({ title: 'Error al eliminar el curso', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cursos de {instrumentLabel(profile?.instrument) || 'tu instrumento'}</h2>
          <p className="text-muted-foreground">Gestiona tus cursos y contenido</p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Crear Curso
        </Button>
      </div>

      {/* Courses List */}
      {courses && courses.length > 0 ? (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {course.thumbnail_url ? (
                      <img loading="lazy" decoding="async" 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{course.title}</h3>
                      {course.is_published ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                          <Eye className="w-3 h-3" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <EyeOff className="w-3 h-3" />
                          Borrador
                        </Badge>
                      )}
                    </div>
                    
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {course.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="outline" className={levelColors[course.level]}>
                        {levelLabels[course.level]}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {course.modules_count || 0} módulos
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {course.lessons_count || 0} lecciones
                      </span>
                      {course.duration_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration_hours}h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setContentCourse(course)}
                    >
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline">Contenido</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(course)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(course)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No tienes cursos aún</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer curso de {instrumentLabel(profile?.instrument) || 'tu instrumento'} para empezar a enseñar
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Crear mi primer curso
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Course Form Dialog */}
      <InstructorCourseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedCourse(null);
        }}
        course={selectedCourse}
      />

      {/* Course Content Manager */}
      {contentCourse && (
        <InstructorCourseContent
          open={!!contentCourse}
          onClose={() => setContentCourse(null)}
          courseId={contentCourse.id}
          courseTitle={contentCourse.title}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el curso "{courseToDelete?.title}" 
              y todo su contenido (módulos y lecciones).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
