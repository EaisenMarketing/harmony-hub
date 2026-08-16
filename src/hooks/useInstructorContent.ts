import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInstructorProfile } from './useInstructorData';
import type { Tables } from '@/integrations/supabase/types';

export type CourseModule = Tables<'course_modules'>;
export type Lesson = Tables<'lessons'>;
export type LiveClass = Tables<'live_classes'>;

export type ModuleWithLessons = CourseModule & { lessons: Lesson[] };

/* ------------------------------ Course content ----------------------------- */

export const useCourseContent = (courseId?: string) =>
  useQuery({
    queryKey: ['instructor-course-content', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data: modules, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });
      if (error) throw error;

      const ids = (modules ?? []).map((m) => m.id);
      let lessons: Lesson[] = [];
      if (ids.length) {
        const { data: ls, error: lErr } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', ids)
          .order('sort_order', { ascending: true });
        if (lErr) throw lErr;
        lessons = ls ?? [];
      }

      return (modules ?? []).map((m) => ({
        ...m,
        lessons: lessons.filter((l) => l.module_id === m.id),
      })) as ModuleWithLessons[];
    },
    enabled: !!courseId,
  });

const useContentInvalidate = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['instructor-course-content'] });
    qc.invalidateQueries({ queryKey: ['instructor-courses'] });
  };
};

export const useCreateModule = () => {
  const invalidate = useContentInvalidate();
  return useMutation({
    mutationFn: async (input: { course_id: string; title: string; description?: string | null; sort_order: number }) => {
      const { data, error } = await supabase.from('course_modules').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
};

export const useUpdateModule = () => {
  const invalidate = useContentInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; title?: string; description?: string | null; sort_order?: number }) => {
      const { error } = await supabase.from('course_modules').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
};

export const useDeleteModule = () => {
  const invalidate = useContentInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
};

export const useCreateLesson = () => {
  const invalidate = useContentInvalidate();
  return useMutation({
    mutationFn: async (input: {
      module_id: string;
      title: string;
      description?: string | null;
      video_url?: string | null;
      duration_minutes?: number | null;
      sort_order: number;
      is_free_preview?: boolean;
    }) => {
      const { data, error } = await supabase.from('lessons').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
};

export const useUpdateLesson = () => {
  const invalidate = useContentInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      title?: string;
      description?: string | null;
      video_url?: string | null;
      duration_minutes?: number | null;
      sort_order?: number;
      is_free_preview?: boolean;
    }) => {
      const { error } = await supabase.from('lessons').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
};

export const useDeleteLesson = () => {
  const invalidate = useContentInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
};

/* ------------------------------- Live classes ------------------------------ */

export const useInstructorLiveClasses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['instructor-live-classes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .eq('instructor_id', user.id)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LiveClass[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateInstructorLiveClass = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useInstructorProfile();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string | null;
      scheduled_at: string;
      duration_minutes: number;
      max_attendees: number;
      zoom_join_url?: string | null;
      required_plan: 'basic' | 'standard' | 'pro';
    }) => {
      if (!user?.id || !profile?.instrument) throw new Error('Perfil de instructor no encontrado');
      const { data, error } = await supabase
        .from('live_classes')
        .insert({
          ...input,
          instrument: profile.instrument,
          instructor_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-live-classes'] }),
  });
};

export const useUpdateInstructorLiveClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      title?: string;
      description?: string | null;
      scheduled_at?: string;
      duration_minutes?: number;
      max_attendees?: number;
      zoom_join_url?: string | null;
      required_plan?: 'basic' | 'standard' | 'pro';
    }) => {
      const { error } = await supabase.from('live_classes').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-live-classes'] }),
  });
};

export const useDeleteInstructorLiveClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('live_classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-live-classes'] }),
  });
};
