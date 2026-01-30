import { BookOpen, Plus, Video, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInstructorProfile } from '@/hooks/useInstructorData';

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
  banjo: 'Banjo',
};

export const InstructorCourses = () => {
  const { data: profile } = useInstructorProfile();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cursos de {instrumentLabels[profile?.instrument || 'guitar']}</h2>
          <p className="text-muted-foreground">Gestiona tus cursos y lecciones</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Crear Curso
        </Button>
      </div>

      {/* Empty State */}
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No tienes cursos aún</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer curso de {instrumentLabels[profile?.instrument || 'guitar']} para empezar a enseñar
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear mi primer curso
          </Button>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Subir Videos</h4>
                <p className="text-sm text-muted-foreground">
                  Podrás subir videos para tus lecciones
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h4 className="font-medium">Asignar Alumnos</h4>
                <p className="text-sm text-muted-foreground">
                  Los alumnos podrán inscribirse en tus cursos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
