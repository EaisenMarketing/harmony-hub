import { BookOpen, Users, Video, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdminStatsProps {
  totalCourses: number;
  totalStudents: number;
  upcomingClasses: number;
  completedLessons: number;
}

export const AdminStats = ({ totalCourses, totalStudents, upcomingClasses, completedLessons }: AdminStatsProps) => {
  const stats = [
    {
      label: 'Cursos Totales',
      value: totalCourses,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Estudiantes',
      value: totalStudents,
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Clases Próximas',
      value: upcomingClasses,
      icon: Video,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Lecciones Completadas',
      value: completedLessons,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
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
  );
};
