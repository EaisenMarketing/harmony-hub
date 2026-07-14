import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useContinueWatching } from '@/hooks/useStudyAnalytics';

interface Props {
  variant?: 'card' | 'inline';
  courseId?: string; // if provided, only shows when the last lesson belongs to this course
  className?: string;
}

/**
 * "Continuar donde lo dejé": takes the user back to their last-watched lesson.
 */
export const ContinueWatchingButton = ({ variant = 'card', courseId, className }: Props) => {
  const navigate = useNavigate();
  const { data: last, isLoading } = useContinueWatching();

  if (isLoading || !last) return null;
  if (courseId && last.courseId !== courseId) return null;

  const go = () =>
    navigate(`/portal/curso/${last.courseId}/leccion/${last.lessonId}`);

  if (variant === 'inline') {
    return (
      <Button size="sm" variant="secondary" onClick={go} className={className}>
        <Play className="w-4 h-4 mr-2" />
        Continuar: {last.lessonTitle}
      </Button>
    );
  }

  return (
    <Card
      className={`overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent cursor-pointer hover:shadow-lg transition-shadow ${className ?? ''}`}
      onClick={go}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-primary font-semibold">
              Continuar donde lo dejaste
            </p>
            <p className="font-semibold truncate">{last.lessonTitle}</p>
            <p className="text-xs text-muted-foreground truncate">{last.courseTitle}</p>
            {last.progressPercent > 0 && last.progressPercent < 100 && (
              <Progress value={last.progressPercent} className="mt-2 h-1.5" />
            )}
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
};
