import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CourseDetails {
  id: string;
  title: string;
  description: string | null;
  instrument: string;
  level: string;
  required_plan: string;
  thumbnail_url: string | null;
}

export interface LessonDetails {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  is_free_preview: boolean;
  sort_order: number | null;
}

export interface ModuleWithLessons {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
  lessons: LessonDetails[];
}

export const useCourseDetails = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-details', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as CourseDetails;
    },
    enabled: !!courseId,
  });
};

export const useCourseContent = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-content', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data: modules, error } = await supabase
        .from('course_modules')
        .select(`
          id,
          title,
          description,
          sort_order,
          lessons (
            id,
            title,
            description,
            video_url,
            duration_minutes,
            is_free_preview,
            sort_order
          )
        `)
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Sort lessons within each module
      const sortedModules = modules?.map(module => ({
        ...module,
        lessons: (module.lessons || []).sort((a: LessonDetails, b: LessonDetails) => 
          (a.sort_order || 0) - (b.sort_order || 0)
        ),
      })) || [];

      return sortedModules as ModuleWithLessons[];
    },
    enabled: !!courseId,
  });
};

export const useUserProgress = (courseId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-course-progress', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user?.id) return { completedLessons: [], lessonProgress: {} };

      // Get all lesson IDs for this course
      const { data: modules } = await supabase
        .from('course_modules')
        .select('lessons(id)')
        .eq('course_id', courseId);

      const lessonIds = modules?.flatMap(m => m.lessons?.map((l: { id: string }) => l.id) || []) || [];

      if (lessonIds.length === 0) return { completedLessons: [], lessonProgress: {} };

      const { data: progress, error } = await supabase
        .from('user_progress')
        .select('lesson_id, completed, progress_percent')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      if (error) throw error;

      const completedLessons = progress?.filter(p => p.completed).map(p => p.lesson_id) || [];
      const lessonProgress: Record<string, number> = {};
      progress?.forEach(p => {
        lessonProgress[p.lesson_id] = p.progress_percent || 0;
      });

      return { completedLessons, lessonProgress };
    },
    enabled: !!courseId && !!user?.id,
  });
};

export const useUserPlan = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return 'basic';

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data?.subscription_plan || 'basic';
    },
    enabled: !!user?.id,
  });
};

export const useUpdateLessonProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      lessonId, 
      progressPercent, 
      completed 
    }: { 
      lessonId: string; 
      progressPercent: number; 
      completed?: boolean;
    }) => {
      if (!user?.id) throw new Error('No user');

      const { data: existing } = await supabase
        .from('user_progress')
        .select('id, completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      // Don't un-complete a lesson
      const isCompleted = existing?.completed || completed || progressPercent >= 90;

      if (existing) {
        const { error } = await supabase
          .from('user_progress')
          .update({
            progress_percent: Math.max(progressPercent, existing.completed ? 100 : 0),
            completed: isCompleted,
            last_watched_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            progress_percent: progressPercent,
            completed: isCompleted,
            last_watched_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['student-courses'] });
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
    },
  });
};
