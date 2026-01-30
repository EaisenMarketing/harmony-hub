import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types
export interface InstructorProfile {
  id: string;
  user_id: string;
  instrument: 'guitar' | 'piano' | 'drums' | 'banjo';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  bio: string | null;
  specialization: string | null;
  years_experience: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  };
}

export interface InstructorActivityLog {
  id: string;
  instructor_id: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  instructor?: {
    instrument: string;
    profile?: {
      full_name: string | null;
    };
  };
}

export interface InstructorStudent {
  id: string;
  instructor_id: string;
  student_id: string;
  instrument: string;
  enrolled_at: string;
  status: 'active' | 'inactive' | 'completed';
  student?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    subscription_plan: string | null;
  };
}

// Check if current user is an instructor
export const useIsInstructor = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-instructor', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'instructor')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id,
  });
};

// Get current instructor's profile
export const useInstructorProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['instructor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as InstructorProfile | null;
    },
    enabled: !!user?.id,
  });
};

// Admin: Get all instructor profiles with user data
export const useAllInstructors = () => {
  return useQuery({
    queryKey: ['all-instructors'],
    queryFn: async () => {
      const { data: instructors, error } = await supabase
        .from('instructor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each instructor
      const userIds = instructors.map((i) => i.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, phone')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return instructors.map((instructor) => ({
        ...instructor,
        profile: profileMap.get(instructor.user_id),
      })) as InstructorProfile[];
    },
  });
};

// Admin: Approve/reject instructor
export const useUpdateInstructorStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { 
      id: string; 
      status: 'approved' | 'rejected' | 'suspended';
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'approved') {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();

        // Also add instructor role to user_roles
        const { data: instructor } = await supabase
          .from('instructor_profiles')
          .select('user_id')
          .eq('id', id)
          .single();

        if (instructor) {
          await supabase
            .from('user_roles')
            .upsert({ 
              user_id: instructor.user_id, 
              role: 'instructor' 
            }, { 
              onConflict: 'user_id,role' 
            });
        }
      }

      const { data, error } = await supabase
        .from('instructor_profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-instructors'] });
    },
  });
};

// Get instructor activity logs (admin view - all logs)
export const useAllActivityLogs = (limit = 50) => {
  return useQuery({
    queryKey: ['all-activity-logs', limit],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('instructor_activity_logs')
        .select(`
          *,
          instructor:instructor_profiles(
            instrument,
            user_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get instructor names
      const userIds = logs
        .map((l) => (l.instructor as { user_id: string })?.user_id)
        .filter(Boolean);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return logs.map((log) => {
        const instructor = log.instructor as { user_id: string; instrument: string } | null;
        return {
          ...log,
          instructor: instructor ? {
            ...instructor,
            profile: profileMap.get(instructor.user_id),
          } : null,
        };
      }) as InstructorActivityLog[];
    },
  });
};

// Get instructor's own activity logs
export const useMyActivityLogs = () => {
  const { data: profile } = useInstructorProfile();

  return useQuery({
    queryKey: ['my-activity-logs', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('instructor_activity_logs')
        .select('*')
        .eq('instructor_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as InstructorActivityLog[];
    },
    enabled: !!profile?.id,
  });
};

// Log instructor activity
export const useLogActivity = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useInstructorProfile();

  return useMutation({
    mutationFn: async ({
      action_type,
      description,
      entity_type,
      entity_id,
      metadata,
    }: {
      action_type: string;
      description: string;
      entity_type?: string;
      entity_id?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!profile?.id) throw new Error('No instructor profile');

      const { data, error } = await supabase
        .from('instructor_activity_logs')
        .insert({
          instructor_id: profile.id,
          action_type,
          description,
          entity_type: entity_type || null,
          entity_id: entity_id || null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['all-activity-logs'] });
    },
  });
};

// Get instructor's students
export const useMyStudents = () => {
  const { data: profile } = useInstructorProfile();

  return useQuery({
    queryKey: ['my-students', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data: students, error } = await supabase
        .from('instructor_students')
        .select('*')
        .eq('instructor_id', profile.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      // Get student profiles
      const studentIds = students.map((s) => s.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, phone, subscription_plan')
        .in('user_id', studentIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return students.map((student) => ({
        ...student,
        student: profileMap.get(student.student_id),
      })) as InstructorStudent[];
    },
    enabled: !!profile?.id,
  });
};

// Admin dashboard stats
export const useInstructorDashboardStats = () => {
  return useQuery({
    queryKey: ['instructor-dashboard-stats'],
    queryFn: async () => {
      const [instructorsRes, pendingRes, logsRes, studentsRes] = await Promise.all([
        supabase
          .from('instructor_profiles')
          .select('id', { count: 'exact' })
          .eq('status', 'approved'),
        supabase
          .from('instructor_profiles')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        supabase
          .from('instructor_activity_logs')
          .select('id', { count: 'exact' })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('instructor_students')
          .select('id', { count: 'exact' })
          .eq('status', 'active'),
      ]);

      // Get activity by type for the chart
      const { data: activityByType } = await supabase
        .from('instructor_activity_logs')
        .select('action_type, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get instructors by instrument
      const { data: byInstrument } = await supabase
        .from('instructor_profiles')
        .select('instrument')
        .eq('status', 'approved');

      const instrumentCounts = byInstrument?.reduce((acc, curr) => {
        acc[curr.instrument] = (acc[curr.instrument] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Group activities by day
      const activityByDay = activityByType?.reduce((acc, curr) => {
        const day = new Date(curr.created_at).toLocaleDateString('es-ES', { weekday: 'short' });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalInstructors: instructorsRes.count || 0,
        pendingApprovals: pendingRes.count || 0,
        weeklyActions: logsRes.count || 0,
        activeStudents: studentsRes.count || 0,
        instructorsByInstrument: instrumentCounts,
        activityByDay,
      };
    },
  });
};

// Request to become an instructor
export const useRequestInstructor = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      instrument,
      bio,
      specialization,
      years_experience,
    }: {
      instrument: 'guitar' | 'piano' | 'drums' | 'banjo';
      bio?: string;
      specialization?: string;
      years_experience?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('instructor_profiles')
        .insert({
          user_id: user.id,
          instrument,
          bio,
          specialization,
          years_experience: years_experience || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['all-instructors'] });
    },
  });
};
