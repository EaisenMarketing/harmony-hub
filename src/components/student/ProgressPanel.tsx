import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, CheckCircle2, Clock, Calendar, Play, BookOpen, ArrowRight, Trophy,
} from 'lucide-react';
import { format, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { useStudentCourses, useUpcomingClasses, useStudentStats } from '@/hooks/useStudentData';
import { INSTRUMENT_PLAN_MAP } from '@/lib/instrument-access';

export const ProgressPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: userIns } = useUserInstrument();
  const primary = userIns?.instrument ?? null;
  const planInfo = primary ? INSTRUMENT_PLAN_MAP[primary] : null;

  const { data: courses = [], isLoading: coursesLoading } = useStudentCourses();
  const { data: classes = [], isLoading: classesLoading } = useUpcomingClasses();
  const { data: stats } = useStudentStats();

  // Recently completed lessons for user
  const { data: recentCompleted = [], isLoading: recentLoading } = useQuery({
    queryKey: ['recent-completed-lessons', user?.id, primary],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, last_watched_at, lessons(id, title, module_id, course_modules(course_id, courses(id, title, instrument, required_plan)))')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('last_watched_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const rows = (data || []) as unknown as Array<{
        lesson_id: string;
        last_watched_at: string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lessons: any;
      }>;
      // Filter by instrument (defensive; RLS should already scope)
      return rows.filter((r) => {
        const course = r.lessons?.course_modules?.courses;
        if (!course || !primary) return false;
        if (primary === 'production') return course.required_plan === 'production';
        return course.instrument === primary;
      }).slice(0, 8);
    },
    enabled: !!user?.id && !!primary,
  });

  const upcoming = classes.filter((c) => isFuture(new Date(c.scheduled_at))).slice(0, 5);

  const totalLessons = courses.reduce((a, c) => a + c.totalLessons, 0);
  const completedLessons = courses.reduce((a, c) => a + c.completedLessons, 0);
  const globalPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (!primary) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          Selecciona tu instrumento para ver tu progreso.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${planInfo?.color ?? 'from-primary to-primary'} flex items-center justify-center shadow-lg text-2xl`}>
            {planInfo?.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold">Mi Progreso</h1>
              <Badge variant="secondary">{planInfo?.label}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Resumen personalizado de tu plan de {planInfo?.label}.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="w-4 h-4" /> Progreso global
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{globalPct}%</span>
              <span className="text-xs text-muted-foreground">{completedLessons}/{totalLessons} lecciones</span>
            </div>
            <Progress value={globalPct} className="mt-2 h-2" />
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="w-4 h-4" /> Lecciones completadas
            </div>
            <div className="mt-2 text-3xl font-bold">{stats?.completedLessons ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">~ {stats?.totalHours ?? 0} h de estudio</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4" /> Próximas clases
            </div>
            <div className="mt-2 text-3xl font-bold">{upcoming.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Filtradas por tu instrumento</p>
          </div>
        </div>
      </div>

      {/* Progreso por curso */}
      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" /> Progreso por curso
        </h2>
        {coursesLoading ? (
          <Card className="animate-pulse h-32" />
        ) : courses.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            Aún no hay cursos disponibles para {planInfo?.label}.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {courses.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/portal/curso/${c.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold line-clamp-1">{c.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.completedLessons}/{c.totalLessons} lecciones · {c.level}
                      </p>
                    </div>
                    <Badge variant={c.progress === 100 ? 'default' : 'secondary'} className="shrink-0">
                      {c.progress}%
                    </Badge>
                  </div>
                  <Progress value={c.progress} className="h-2" />
                  <Button size="sm" variant="ghost" className="mt-3 gap-1 -ml-2">
                    Continuar <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Clases completadas recientemente */}
      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" /> Lecciones completadas recientemente
        </h2>
        {recentLoading ? (
          <Card className="animate-pulse h-20" />
        ) : recentCompleted.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            Aún no has completado lecciones. ¡Empieza hoy tu primer curso!
          </CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {recentCompleted.map((r) => {
                const course = r.lessons?.course_modules?.courses;
                return (
                  <Link
                    key={r.lesson_id}
                    to={course ? `/portal/curso/${course.id}/leccion/${r.lesson_id}` : '#'}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.lessons?.title ?? 'Lección'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {course?.title ?? '—'}
                        {r.last_watched_at && ` · ${format(new Date(r.last_watched_at), "d MMM yyyy", { locale: es })}`}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Próximas clases */}
      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" /> Próximas clases en vivo
        </h2>
        {classesLoading ? (
          <Card className="animate-pulse h-20" />
        ) : upcoming.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            No tienes clases próximas programadas.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((cls) => (
              <Card key={cls.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2"><Play className="w-4 h-4 text-primary" />{cls.title}</span>
                    {cls.isRegistered && <Badge className="shrink-0">Inscrito</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(cls.scheduled_at), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                    {cls.duration_minutes ? ` · ${cls.duration_minutes} min` : ''}
                  </p>
                  {cls.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{cls.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/portal/calendario')}>
            Ver calendario completo
          </Button>
        </div>
      </section>
    </div>
  );
};
