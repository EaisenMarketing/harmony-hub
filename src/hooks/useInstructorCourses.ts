import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInstructorProfile, useLogActivity } from './useInstructorData';
import type { Tables } from '@/integrations/supabase/types';

export type InstructorCourse = Tables<'courses'> & {
  modules_count?: number;
  lessons_count?: number;
};

// Get instructor's own courses (filtered by their instrument)
export const useInstructorCourses = () => {
  const { user } = useAuth();
  const { data: profile } = useInstructorProfile();

  return useQuery({
    queryKey: ['instructor-courses', user?.id, profile?.instrument],
    queryFn: async () => {
      if (!user?.id || !profile?.instrument) return [];

      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by', user.id)
        .eq('instrument', profile.instrument)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get module and lesson counts for each course
      const coursesWithCounts = await Promise.all(
        courses.map(async (course) => {
          const { data: modules } = await supabase
            .from('course_modules')
            .select('id')
            .eq('course_id', course.id);

          let lessonsCount = 0;
          if (modules && modules.length > 0) {
            const moduleIds = modules.map(m => m.id);
            const { count } = await supabase
              .from('lessons')
              .select('id', { count: 'exact', head: true })
              .in('module_id', moduleIds);
            lessonsCount = count || 0;
          }

          return {
            ...course,
            modules_count: modules?.length || 0,
            lessons_count: lessonsCount,
          };
        })
      );

      return coursesWithCounts as InstructorCourse[];
    },
    enabled: !!user?.id && !!profile?.instrument,
  });
};

// Create a new course
export const useCreateInstructorCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useInstructorProfile();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async (courseData: {
      title: string;
      description?: string;
      level: 'beginner' | 'intermediate' | 'advanced';
      required_plan: 'basic' | 'standard' | 'pro';
      duration_hours?: number | null;
      thumbnail_url?: string | null;
      is_published?: boolean;
    }) => {
      if (!user?.id || !profile?.instrument) {
        throw new Error('No instructor profile found');
      }

      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseData,
          instrument: profile.instrument,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      // Log activity
      logActivity.mutate({
        action_type: 'course_created',
        description: `Creó el curso "${data.title}"`,
        entity_type: 'course',
        entity_id: data.id,
        metadata: { course_title: data.title, level: data.level },
      });
    },
  });
};

// Update a course
export const useUpdateInstructorCourse = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async ({
      id,
      ...courseData
    }: {
      id: string;
      title?: string;
      description?: string;
      level?: 'beginner' | 'intermediate' | 'advanced';
      required_plan?: 'basic' | 'standard' | 'pro';
      duration_hours?: number | null;
      thumbnail_url?: string | null;
      is_published?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      logActivity.mutate({
        action_type: 'course_updated',
        description: `Actualizó el curso "${data.title}"`,
        entity_type: 'course',
        entity_id: data.id,
        metadata: { course_title: data.title },
      });
    },
  });
};

// Delete a course
export const useDeleteInstructorCourse = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async (courseId: string) => {
      // First get course info for logging
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      return { id: courseId, title: course?.title };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      if (data.title) {
        logActivity.mutate({
          action_type: 'course_deleted',
          description: `Eliminó el curso "${data.title}"`,
          entity_type: 'course',
          entity_id: data.id,
        });
      }
    },
  });
};
