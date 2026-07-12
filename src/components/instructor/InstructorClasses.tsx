import { Video, Plus, Calendar, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInstructorProfile } from '@/hooks/useInstructorData';

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
};

export const InstructorClasses = () => {
  const { data: profile } = useInstructorProfile();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Clases en Vivo</h2>
          <p className="text-muted-foreground">Programa y gestiona tus clases de {instrumentLabels[profile?.instrument || 'guitar']}</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Programar Clase
        </Button>
      </div>

      {/* Empty State */}
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No tienes clases programadas</h3>
          <p className="text-muted-foreground mb-4">
            Programa una clase en vivo para tus alumnos de {instrumentLabels[profile?.instrument || 'guitar']}
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Programar mi primera clase
          </Button>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Integración con Zoom</h4>
                <p className="text-sm text-muted-foreground">
                  Las clases se crearán automáticamente en Zoom
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
                <h4 className="font-medium">Registro de Asistencia</h4>
                <p className="text-sm text-muted-foreground">
                  Podrás ver quién asistió a cada clase
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
