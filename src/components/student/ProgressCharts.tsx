import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Clock, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { useStudyAnalytics } from '@/hooks/useStudyAnalytics';
import { useStudentCourses } from '@/hooks/useStudentData';

const formatMinutes = (m: number) => {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
};

export const ProgressCharts = () => {
  const { data: analytics } = useStudyAnalytics();
  const { data: courses = [] } = useStudentCourses();

  const weekly = analytics?.weekly ?? [];
  const streak = analytics?.streakDays ?? 0;
  const totalMin = analytics?.totalMinutesWeek ?? 0;
  const lessons = analytics?.lessonsWeek ?? 0;
  const delta = analytics?.weekPercentDelta ?? 0;
  const positive = delta >= 0;

  const totalLessons = courses.reduce((a, c) => a + c.totalLessons, 0);
  const doneLessons = courses.reduce((a, c) => a + c.completedLessons, 0);
  const globalPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" /> Progreso global
            </div>
            <div className="mt-2 text-3xl font-bold">{globalPct}%</div>
            <p className="text-xs text-muted-foreground mt-1">{doneLessons}/{totalLessons} lecciones</p>
            <Progress value={globalPct} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="w-4 h-4 text-orange-500" /> Racha
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{streak}</span>
              <span className="text-sm text-muted-foreground">{streak === 1 ? 'día' : 'días'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {streak > 0 ? '¡Mantén tu racha diaria!' : 'Estudia hoy para empezar tu racha.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" /> Esta semana
            </div>
            <div className="mt-2 text-3xl font-bold">{formatMinutes(totalMin)}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{lessons} lecciones</p>
              {totalMin > 0 && (
                <Badge variant={positive ? 'default' : 'secondary'} className="gap-1 text-[10px] py-0">
                  {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {positive ? '+' : ''}{delta}% vs semana pasada
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Tiempo estudiado (últimos 7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v}m`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} min`, 'Tiempo']}
                  labelFormatter={(l) => `Día: ${l}`}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {weekly.map((d, i) => (
                    <Cell key={i} fill={d.minutes > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Per-course progress bars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Progreso por curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aún no hay cursos disponibles.</p>
          ) : (
            <div className="space-y-4">
              {courses.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate mr-2">{c.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {c.completedLessons}/{c.totalLessons} · {c.progress}%
                    </span>
                  </div>
                  <Progress value={c.progress} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
