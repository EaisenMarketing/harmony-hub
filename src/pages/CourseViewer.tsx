import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedVideoPlayer } from '@/components/student/ProtectedVideoPlayer';
import { LessonSidebar } from '@/components/student/LessonSidebar';
import { LessonNotesPanel } from '@/components/student/LessonNotesPanel';
import { 
  useCourseDetails, 
  useCourseContent, 
  useUserProgress, 
  useUserPlan,
  useUpdateLessonProgress 
} from '@/hooks/useCourseViewer';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CourseViewer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: course, isLoading: courseLoading } = useCourseDetails(courseId);
  const { data: modules = [], isLoading: contentLoading } = useCourseContent(courseId);
  const { data: userProgress } = useUserProgress(courseId);
  const { data: userPlan = 'basic' } = useUserPlan();
  const updateProgress = useUpdateLessonProgress();

  // Get all lessons in order
  const allLessons = useMemo(() => {
    return modules.flatMap(m => m.lessons);
  }, [modules]);

  // Find current lesson
  const currentLesson = useMemo(() => {
    if (lessonId) {
      return allLessons.find(l => l.id === lessonId);
    }
    // If no lessonId, find first unwatched or first lesson
    const firstUnwatched = allLessons.find(l => 
      !userProgress?.completedLessons.includes(l.id)
    );
    return firstUnwatched || allLessons[0];
  }, [lessonId, allLessons, userProgress]);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  useEffect(() => {
    if (currentLesson && !selectedLessonId) {
      setSelectedLessonId(currentLesson.id);
    }
  }, [currentLesson, selectedLessonId]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentVideoTime(time);
  }, []);

  const handleSeekToTime = useCallback((seconds: number) => {
    setSeekToTime(seconds);
    // Reset after a moment to allow re-seeking to same time
    setTimeout(() => setSeekToTime(null), 100);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    navigate(`/portal/curso/${courseId}/leccion/${lessonId}`, { replace: true });
  };

  const handleProgress = (percent: number) => {
    if (selectedLessonId) {
      // Throttle updates - only save every 10%
      const rounded = Math.floor(percent / 10) * 10;
      const currentProgress = userProgress?.lessonProgress[selectedLessonId] || 0;
      
      if (rounded > currentProgress && rounded % 10 === 0) {
        updateProgress.mutate({
          lessonId: selectedLessonId,
          progressPercent: rounded,
        });
      }
    }
  };

  const handleComplete = () => {
    if (selectedLessonId) {
      updateProgress.mutate({
        lessonId: selectedLessonId,
        progressPercent: 100,
        completed: true,
      });
      toast({
        title: '¡Lección completada! 🎉',
        description: 'Tu progreso ha sido guardado.',
      });
    }
  };

  const selectedLesson = allLessons.find(l => l.id === selectedLessonId);
  const planHierarchy: Record<string, number> = { basic: 1, standard: 2, pro: 3 };
  const isLocked = selectedLesson && !selectedLesson.is_free_preview && 
    planHierarchy[userPlan] < planHierarchy[course?.required_plan || 'basic'];

  if (authLoading || courseLoading || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <BookOpen className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Curso no encontrado</h1>
        <Button onClick={() => navigate('/portal')}>Volver al portal</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/portal')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{course.title}</h1>
            {selectedLesson && (
              <p className="text-sm text-muted-foreground truncate">
                {selectedLesson.title}
              </p>
            )}
          </div>
        </header>

        {/* Video Player */}
        <div className="flex-1 p-4 lg:p-6">
          {selectedLesson?.video_url ? (
            <ProtectedVideoPlayer
              videoUrl={selectedLesson.video_url}
              isLocked={!!isLocked}
              requiredPlan={course.required_plan || 'basic'}
              currentPlan={userPlan}
              onProgress={handleProgress}
              onComplete={handleComplete}
              onTimeUpdate={handleTimeUpdate}
              initialProgress={userProgress?.lessonProgress[selectedLesson.id] || 0}
              seekToTime={seekToTime}
            />
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {selectedLesson ? 'Esta lección no tiene video' : 'Selecciona una lección'}
                </p>
              </div>
            </div>
          )}

          {/* Lesson Info & Notes Toggle */}
          {selectedLesson && (
            <div className="mt-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedLesson.title}
                  </h2>
                  {selectedLesson.description && (
                    <p className="text-muted-foreground mt-2">
                      {selectedLesson.description}
                    </p>
                  )}
                </div>
                <Button
                  variant={showNotesPanel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowNotesPanel(!showNotesPanel)}
                  className="shrink-0"
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Notas
                  {showNotesPanel ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>

              {/* Notes Panel */}
              <div
                className={cn(
                  "transition-all duration-300 overflow-hidden",
                  showNotesPanel ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <LessonNotesPanel
                  lessonId={selectedLesson.id}
                  currentVideoTime={currentVideoTime}
                  onSeekToTime={handleSeekToTime}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <LessonSidebar
        modules={modules}
        currentLessonId={selectedLessonId || ''}
        completedLessons={userProgress?.completedLessons || []}
        userPlan={userPlan}
        requiredPlan={course.required_plan || 'basic'}
        onSelectLesson={handleSelectLesson}
      />
    </div>
  );
};

export default CourseViewer;
