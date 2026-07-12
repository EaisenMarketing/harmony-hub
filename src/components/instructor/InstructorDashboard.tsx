import { Users, BookOpen, Video, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyStudents, useMyActivityLogs, useInstructorProfile } from '@/hooks/useInstructorData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const actionLabels: Record<string, string> = {
  course_created: 'Curso creado',
  lesson_added: 'Lección añadida',
  class_scheduled: 'Clase programada',
  student_enrolled: 'Alumno inscrito',
  video_uploaded: 'Video subido',
  module_created: 'Módulo creado',
  class_completed: 'Clase completada',
};

export const InstructorDashboard = () => {
  const { data: profile } = useInstructorProfile();
  const { data: students = [], isLoading: studentsLoading } = useMyStudents();
  const { data: activityLogs = [], isLoading: logsLoading } = useMyActivityLogs();

  const activeStudents = students.filter((s) => s.status === 'active');

  const stats = [
    {
      label: 'Alumnos Activos',
      value: activeStudents.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Cursos Creados',
      value: activityLogs.filter((l) => l.action_type === 'course_created').length,
      icon: BookOpen,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Clases Programadas',
      value: activityLogs.filter((l) => l.action_type === 'class_scheduled').length,
      icon: Video,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Acciones Totales',
      value: activityLogs.length,
      icon: Activity,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-foreground">
            ¡Bienvenido, Instructor!
          </h2>
          <p className="text-muted-foreground mt-1">
            Estás enseñando {profile?.instrument === 'guitar' ? 'Guitarra' : 
              profile?.instrument === 'piano' ? 'Piano' : 
              profile?.instrument === 'drums' ? 'Batería' : profile?.instrument}
            {profile?.specialization && ` • ${profile.specialization}`}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Alumnos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : activeStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tienes alumnos asignados aún
              </div>
            ) : (
              <div className="space-y-3">
                {activeStudents.slice(0, 5).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{student.student?.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-muted-foreground">
                        Plan: {student.student?.subscription_plan?.toUpperCase() || 'BASIC'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(student.enrolled_at), "d MMM", { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Mi Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay actividad registrada
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{log.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {actionLabels[log.action_type] || log.action_type}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {format(new Date(log.created_at), "d MMM", { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
