import { Check, Lock, Play, Clock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Lesson {
  id: string;
  title: string;
  duration_minutes: number | null;
  is_free_preview: boolean;
  video_url: string | null;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface LessonSidebarProps {
  modules: Module[];
  currentLessonId: string;
  completedLessons: string[];
  userPlan: string;
  onSelectLesson: (lessonId: string) => void;
}

const planHierarchy: Record<string, number> = {
  basic: 1,
  standard: 2,
  pro: 3,
};

const FREE_LESSONS_FOR_BASIC = 3;

export const LessonSidebar = ({
  modules,
  currentLessonId,
  completedLessons,
  userPlan,
  onSelectLesson,
}: LessonSidebarProps) => {
  const navigate = useNavigate();
  const hasFullAccess = planHierarchy[userPlan] >= planHierarchy['standard'];
  
  // Count total lessons to track the global index
  let globalLessonIndex = 0;

  return (
    <div className="w-full lg:w-80 bg-card border-l border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Contenido del Curso</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {completedLessons.length} lecciones completadas
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-2">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="mb-4">
              <div className="px-3 py-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Módulo {moduleIndex + 1}
                </h4>
                <p className="text-sm font-semibold text-foreground">{module.title}</p>
              </div>

              <div className="space-y-1">
                {module.lessons.map((lesson, lessonIndex) => {
                  const currentGlobalIndex = globalLessonIndex;
                  globalLessonIndex++;
                  
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isCurrent = lesson.id === currentLessonId;
                  const hasVideo = !!lesson.video_url;
                  
                  // For Basic plan: lock lessons after the first 3 (unless it's free preview)
                  const isLockedForBasicPlan = !hasFullAccess && 
                    currentGlobalIndex >= FREE_LESSONS_FOR_BASIC && 
                    !lesson.is_free_preview;
                  
                  const isLocked = isLockedForBasicPlan;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && hasVideo && onSelectLesson(lesson.id)}
                      disabled={isLocked || !hasVideo}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        isCurrent && "bg-primary/10 border border-primary/30",
                        !isCurrent && !isLocked && hasVideo && "hover:bg-muted/50",
                        (isLocked || !hasVideo) && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          isCompleted && "bg-green-500/20 text-green-500",
                          isCurrent && !isCompleted && "bg-primary text-primary-foreground",
                          !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-sm">{lessonIndex + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isCurrent ? "text-primary" : "text-foreground"
                        )}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lesson.duration_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.duration_minutes} min
                            </span>
                          )}
                          {lesson.is_free_preview && (
                            <Badge variant="outline" className="text-xs py-0 h-5">
                              Gratis
                            </Badge>
                          )}
                          {isLocked && (
                            <Badge variant="secondary" className="text-xs py-0 h-5">
                              Premium
                            </Badge>
                          )}
                        </div>
                      </div>

                      {hasVideo && !isLocked && (
                        <Play className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Upgrade Banner for Basic Users */}
          {!hasFullAccess && (
            <div className="mx-2 mt-4 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">¡Desbloquea todo!</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Obtén la suscripción Estándar para acceder a todas las lecciones y herramientas de IA.
              </p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/portal/pagos')}
              >
                Ver planes desde $120/mes
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
