import { 
  Users, 
  Clock, 
  Activity, 
  GraduationCap,
  TrendingUp,
  Music
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { useInstructorDashboardStats, useAllActivityLogs } from '@/hooks/useInstructorData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#fbbf24', '#8b5cf6'];

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
};

const actionLabels: Record<string, string> = {
  course_created: 'Curso creado',
  lesson_added: 'Lección añadida',
  class_scheduled: 'Clase programada',
  student_enrolled: 'Alumno inscrito',
  video_uploaded: 'Video subido',
  module_created: 'Módulo creado',
  class_completed: 'Clase completada',
};

export const AdminDashboardCharts = () => {
  const { data: stats, isLoading: statsLoading } = useInstructorDashboardStats();
  const { data: recentLogs = [], isLoading: logsLoading } = useAllActivityLogs(20);

  if (statsLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Prepare pie chart data for instructors by instrument
  const instrumentData = Object.entries(stats?.instructorsByInstrument || {}).map(([key, value]) => ({
    name: instrumentLabels[key] || key,
    value,
  }));

  // Prepare bar chart data for activity by day
  const activityData = Object.entries(stats?.activityByDay || {}).map(([day, count]) => ({
    day,
    acciones: count,
  }));

  // Stats cards data
  const statsCards = [
    {
      label: 'Instructores Activos',
      value: stats?.totalInstructors || 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pendientes de Aprobación',
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Acciones esta Semana',
      value: stats?.weeklyActions || 0,
      icon: Activity,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Estudiantes Activos',
      value: stats?.activeStudents || 0,
      icon: GraduationCap,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Instructors by Instrument Pie Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Instructores por Instrumento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {instrumentData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos de instructores
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={instrumentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {instrumentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Activity Bar Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Actividad Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos de actividad
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="acciones" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Actividad Reciente de Instructores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay actividad reciente
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {log.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {log.instructor?.profile?.full_name || 'Instructor'} • {' '}
                      {actionLabels[log.action_type] || log.action_type}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground shrink-0">
                    {format(new Date(log.created_at), "d MMM, HH:mm", { locale: es })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
