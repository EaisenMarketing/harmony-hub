import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CourseWithProgress {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instrument: string;
  level: string;
  duration_hours: number | null;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export interface UpcomingClass {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  instrument: string | null;
  max_attendees: number | null;
  zoom_join_url: string | null;
  isRegistered: boolean;
  registeredCount: number;
}

export interface AvailableCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instrument: string;
  level: string;
  duration_hours: number | null;
  required_plan: string | null;
}

export const useStudentProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useStudentCourses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's primary instrument
      const { data: prof } = await supabase
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('primary_instrument' as any)
        .eq('user_id', user.id)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const primary = (prof as any)?.primary_instrument as string | null;

      // Get all published courses
      let query = supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          instrument,
          level,
          duration_hours,
          required_plan
        `)
        .eq('is_published', true);

      // Filter by user's instrument
      if (primary === 'production') {
        query = query.eq('required_plan', 'production');
      } else if (primary) {
        query = query.eq('instrument', primary as 'guitar' | 'piano' | 'drums');
      } else {
        // No instrument yet → no courses visible
        return [];
      }

      const { data: courses, error: coursesError } = await query;

      if (coursesError) throw coursesError;

      // Get user progress
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id, completed, progress_percent')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Get lessons count per course
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          course_id,
          lessons (id)
        `);

      if (modulesError) throw modulesError;

      // Calculate progress for each course
      const coursesWithProgress: CourseWithProgress[] = courses?.map(course => {
        const courseModules = modules?.filter(m => m.course_id === course.id) || [];
        const lessonIds = courseModules.flatMap(m => m.lessons?.map((l: { id: string }) => l.id) || []);
        const totalLessons = lessonIds.length;

        const userLessonProgress = progress?.filter(p => lessonIds.includes(p.lesson_id)) || [];
        const completedLessons = userLessonProgress.filter(p => p.completed).length;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          ...course,
          progress: progressPercent,
          completedLessons,
          totalLessons,
        };
      }) || [];

      return coursesWithProgress;
    },
    enabled: !!user?.id,
  });
};


export const useUpcomingClasses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-classes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Public class metadata (no Zoom credentials exposed)
      const { data: classes, error: classesError } = await supabase
        .from('live_classes')
        .select('id, title, description, instructor_id, instrument, scheduled_at, duration_minutes, required_plan, max_attendees, is_recorded, recording_url, created_at')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (classesError) throw classesError;

      const { data: registrations, error: regError } = await supabase
        .from('live_class_registrations')
        .select('live_class_id')
        .eq('user_id', user.id);

      if (regError) throw regError;

      const registeredClassIds = new Set(registrations?.map(r => r.live_class_id) || []);

      // Get registration counts for all classes
      const classIds = classes?.map(c => c.id) || [];
      const { data: allRegistrations, error: countError } = await supabase
        .from('live_class_registrations')
        .select('live_class_id')
        .in('live_class_id', classIds);

      if (countError) throw countError;

      // Count registrations per class
      const registrationCounts: Record<string, number> = {};
      allRegistrations?.forEach(reg => {
        registrationCounts[reg.live_class_id] = (registrationCounts[reg.live_class_id] || 0) + 1;
      });

      // Fetch Zoom credentials only for accessible classes via secure view
      // (RLS on the view restricts to admins, the instructor, or registered users with active subscription)
      const { data: zoomData } = await (supabase as any)
        .from('live_classes_with_zoom')
        .select('id, zoom_join_url, zoom_meeting_id')
        .in('id', classIds);

      const zoomMap = new Map<string, { zoom_join_url: string | null }>();
      (zoomData || []).forEach((z: { id: string; zoom_join_url: string | null }) => {
        zoomMap.set(z.id, { zoom_join_url: z.zoom_join_url });
      });

      const upcomingClasses: UpcomingClass[] = classes?.map(cls => ({
        ...cls,
        zoom_join_url: zoomMap.get(cls.id)?.zoom_join_url ?? null,
        isRegistered: registeredClassIds.has(cls.id),
        registeredCount: registrationCounts[cls.id] || 0,
      })) || [];

      return upcomingClasses;
    },
    enabled: !!user?.id,
  });
};

export const useStudentStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { completedLessons: 0, totalHours: 0, certificates: 0, streak: 0 };

      const { data: progress, error } = await supabase
        .from('user_progress')
        .select('completed, lesson_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const completedLessons = progress?.filter(p => p.completed).length || 0;
      // Estimate hours based on completed lessons (assuming ~15min per lesson)
      const totalHours = Math.round((completedLessons * 15) / 60);

      return {
        completedLessons,
        totalHours,
        certificates: 0, // Will be implemented with certificates table
        streak: 7, // Placeholder - would need activity tracking
      };
    },
    enabled: !!user?.id,
  });
};

export const useAvailableCourses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['available-courses', user?.id],
    queryFn: async () => {
      let primary: string | null = null;
      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select('primary_instrument' as any)
          .eq('user_id', user.id)
          .maybeSingle();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        primary = (prof as any)?.primary_instrument ?? null;
      }

      let query = supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          instrument,
          level,
          duration_hours,
          required_plan
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (primary === 'production') {
        query = query.eq('required_plan', 'production');
      } else if (primary) {
        query = query.eq('instrument', primary as 'guitar' | 'piano' | 'drums');
      } else {
        return [] as AvailableCourse[];
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AvailableCourse[];
    },
  });
};


export const useUserRegistrations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-registrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('live_class_registrations')
        .select('id, live_class_id, registered_at, attended')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};
