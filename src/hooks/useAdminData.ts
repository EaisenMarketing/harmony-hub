import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id,
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [coursesRes, studentsRes, classesRes, progressRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('live_classes').select('id', { count: 'exact' }).gte('scheduled_at', new Date().toISOString()),
        supabase.from('user_progress').select('id', { count: 'exact' }).eq('completed', true),
      ]);

      return {
        totalCourses: coursesRes.count || 0,
        totalStudents: studentsRes.count || 0,
        upcomingClasses: classesRes.count || 0,
        completedLessons: progressRes.count || 0,
      };
    },
  });
};

export const useAdminCourses = () => {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules (
            id,
            title,
            lessons (id)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCourseModules = (courseId: string | null) => {
  return useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const { data, error } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons (*)
        `)
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (course: Omit<TablesInsert<'courses'>, 'created_by'>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert({ ...course, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'courses'> & { id: string }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: TablesInsert<'course_modules'>) => {
      const { data, error } = await supabase
        .from('course_modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', variables.course_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: TablesInsert<'lessons'>) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert(lesson)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
};

export const useAdminLiveClasses = () => {
  return useQuery({
    queryKey: ['admin-live-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_classes')
        .select(`
          *,
          live_class_registrations (id)
        `)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateLiveClass = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (liveClass: Omit<TablesInsert<'live_classes'>, 'instructor_id'>) => {
      const { data, error } = await supabase
        .from('live_classes')
        .insert({ ...liveClass, instructor_id: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-live-classes'] });
    },
  });
};

export const useDeleteLiveClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('live_classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-live-classes'] });
    },
  });
};

export const useAdminStudents = () => {
  return useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
