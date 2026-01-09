import { Play, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { CourseWithProgress } from '@/hooks/useStudentData';

interface CourseCardProps {
  course: CourseWithProgress;
}

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

export const CourseCard = ({ course }: CourseCardProps) => {
  const emoji = instrumentEmojis[course.instrument] || '🎵';
  const levelLabel = levelLabels[course.level] || course.level;

  return (
    <Card className="group overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{emoji}</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/90 text-foreground">
            {levelLabel}
          </Badge>
        </div>
        {course.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <Progress value={course.progress} className="h-2" />
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {course.description || 'Aprende a tu ritmo con lecciones prácticas.'}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.duration_hours && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration_hours}h</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span>{course.completedLessons}/{course.totalLessons} lecciones</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium text-primary">{course.progress}% completado</span>
          <Button size="sm" className="gap-2">
            <Play className="w-4 h-4" />
            {course.progress > 0 ? 'Continuar' : 'Comenzar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
