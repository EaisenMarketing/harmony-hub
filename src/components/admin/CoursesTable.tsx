import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronRight, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useAdminCourses, useDeleteCourse, useCourseModules } from '@/hooks/useAdminData';
import { CourseForm } from './CourseForm';
import { ModuleLessonForm } from './ModuleLessonForm';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

const instrumentEmojis: Record<string, string> = {
  guitar: '🎸',
  piano: '🎹',
  drums: '🥁',
  banjo: '🪕',
};

const levelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const CoursesTable = () => {
  const { data: courses = [], isLoading } = useAdminCourses();
  const deleteCourse = useDeleteCourse();
  const { toast } = useToast();

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Tables<'courses'> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();

  const { data: modules = [] } = useCourseModules(expandedCourse);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCourse.mutateAsync(deleteId);
      toast({ title: 'Curso eliminado exitosamente' });
    } catch (error) {
      toast({ title: 'Error al eliminar el curso', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleAddContent = (moduleId?: string) => {
    setSelectedModuleId(moduleId);
    setShowModuleForm(true);
  };

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Gestión de Cursos</CardTitle>
          <Button onClick={() => setShowCourseForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Curso
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Instrumento</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <>
                  <TableRow key={course.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedCourse === course.id ? 'rotate-90' : ''}`} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {course.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl">{instrumentEmojis[course.instrument]}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{levelLabels[course.level]}</Badge>
                    </TableCell>
                    <TableCell>
                      {course.course_modules?.length || 0} módulos
                    </TableCell>
                    <TableCell>
                      {course.is_published ? (
                        <Badge className="bg-secondary/20 text-secondary">
                          <Eye className="w-3 h-3 mr-1" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Borrador
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExpandedCourse(course.id);
                            handleAddContent();
                          }}
                        >
                          <FolderPlus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCourse(course);
                            setShowCourseForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedCourse === course.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Módulos y Lecciones</h4>
                            <Button size="sm" variant="outline" onClick={() => handleAddContent()}>
                              <Plus className="w-4 h-4 mr-1" />
                              Agregar Módulo
                            </Button>
                          </div>
                          {modules.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay módulos aún.</p>
                          ) : (
                            <div className="space-y-2">
                              {modules.map((module) => (
                                <div key={module.id} className="bg-background rounded-lg p-3 border border-border/50">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{module.title}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {module.lessons?.length || 0} lecciones
                                      </p>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => handleAddContent(module.id)}>
                                      <Plus className="w-4 h-4 mr-1" />
                                      Lección
                                    </Button>
                                  </div>
                                  {module.lessons && module.lessons.length > 0 && (
                                    <div className="mt-2 pl-4 border-l-2 border-border space-y-1">
                                      {module.lessons.map((lesson) => (
                                        <div key={lesson.id} className="flex items-center justify-between py-1 text-sm">
                                          <span>{lesson.title}</span>
                                          <span className="text-muted-foreground">{lesson.duration_minutes} min</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay cursos. Crea tu primer curso.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CourseForm
        open={showCourseForm}
        onClose={() => {
          setShowCourseForm(false);
          setEditingCourse(null);
        }}
        course={editingCourse}
      />

      {expandedCourse && (
        <ModuleLessonForm
          open={showModuleForm}
          onClose={() => {
            setShowModuleForm(false);
            setSelectedModuleId(undefined);
          }}
          courseId={expandedCourse}
          moduleId={selectedModuleId}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los módulos y lecciones asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
