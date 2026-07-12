import { Award, Download, Share2, Calendar, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentCourses } from '@/hooks/useStudentData';
import { useUserPlan } from '@/hooks/useCourseViewer';
import { hasAccessToFeature, FEATURE_ACCESS, PLAN_LABELS } from '@/lib/plans';
const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
};

export const CertificatesPage = () => {
  const { data: courses = [] } = useStudentCourses();
  const { data: userPlan = 'basic' } = useUserPlan();
  const canAccess = hasAccessToFeature(userPlan, FEATURE_ACCESS.certificates);
  
  // Filter completed courses (100% progress)
  const completedCourses = courses.filter((course) => course.progress === 100);

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Certificados</h1>
          <p className="text-muted-foreground mt-1">Descarga y comparte tus logros</p>
        </div>
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Certificados Bloqueados</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Los certificados oficiales están disponibles a partir del plan <strong>{PLAN_LABELS.pro}</strong>.
              Tu plan actual es <strong>{PLAN_LABELS[userPlan as keyof typeof PLAN_LABELS] || userPlan}</strong>.
            </p>
            <Button>Actualizar Plan</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Certificados</h1>
        <p className="text-muted-foreground mt-1">
          Descarga y comparte tus logros
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedCourses.length}</p>
              <p className="text-sm text-muted-foreground">Certificados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Cursos Inscritos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {courses.filter((c) => (c.progress || 0) > 0).length}
              </p>
              <p className="text-sm text-muted-foreground">En Progreso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates */}
      {completedCourses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Aún no tienes certificados
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Completa tus cursos al 100% para obtener certificados que puedes descargar y compartir.
            </p>
            <Button variant="outline">
              Ver Mis Cursos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {completedCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 text-center border-b">
                <Award className="w-16 h-16 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-1">
                  Certificado de Completación
                </h3>
                <p className="text-muted-foreground">{course.title}</p>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {instrumentLabels[course.instrument] || course.instrument}
                    </Badge>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Completado
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Courses in Progress */}
      {courses.filter((c) => (c.progress || 0) > 0 && (c.progress || 0) < 100).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Próximos Certificados
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses
              .filter((c) => (c.progress || 0) > 0 && (c.progress || 0) < 100)
              .map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Award className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {course.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {course.progress}% completado
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
