import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import type { TeacherPlanId } from '@/lib/teacher-plans';
import { TEACHER_PLAN_MAP } from '@/lib/teacher-plans';

export type TeacherAccount = Tables<'teacher_accounts'>;
export type StudioStudent = Tables<'teacher_students'>;
export type StudioCourse = Tables<'teacher_courses'>;
export type StudioLesson = Tables<'teacher_lessons'>;
export type StudioAssignment = Tables<'teacher_assignments'>;

/* ------------------------------------------------------------------ */
/* Cuenta del maestro                                                  */
/* ------------------------------------------------------------------ */

export const useMyTeacherAccount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['teacher-account', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('teacher_accounts')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as TeacherAccount | null;
    },
    enabled: !!user?.id,
  });
};

export const useCreateTeacherAccount = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      studio_name: string;
      primary_instrument?: string | null;
      contact_email?: string | null;
      phone?: string | null;
      bio?: string | null;
      plan?: TeacherPlanId;
    }) => {
      if (!user?.id) throw new Error('Necesitas iniciar sesión.');
      const plan = input.plan ?? 'starter';
      const { data, error } = await supabase
        .from('teacher_accounts')
        .insert({
          owner_user_id: user.id,
          studio_name: input.studio_name,
          primary_instrument: input.primary_instrument ?? null,
          contact_email: input.contact_email ?? user.email ?? null,
          phone: input.phone ?? null,
          bio: input.bio ?? null,
          plan,
          seat_limit: TEACHER_PLAN_MAP[plan].seats,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TeacherAccount;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-account'] }),
  });
};

export const useUpdateTeacherAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<TeacherAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('teacher_accounts')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TeacherAccount;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-account'] });
      qc.invalidateQueries({ queryKey: ['admin-teacher-accounts'] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Alumnos del estudio                                                 */
/* ------------------------------------------------------------------ */

export const useStudioStudents = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-students', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_students')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudioStudent[];
    },
    enabled: !!accountId,
  });

export const useSaveStudioStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<StudioStudent> & { teacher_account_id: string; full_name: string; email: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase
          .from('teacher_students')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('teacher_students')
        .insert(rest)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio-students'] }),
  });
};

export const useDeleteStudioStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio-students'] }),
  });
};

/* ------------------------------------------------------------------ */
/* Cursos y lecciones propios del maestro                              */
/* ------------------------------------------------------------------ */

export const useStudioCourses = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-courses', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_courses')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudioCourse[];
    },
    enabled: !!accountId,
  });

export const useSaveStudioCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<StudioCourse> & { teacher_account_id: string; title: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase.from('teacher_courses').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from('teacher_courses').insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio-courses'] }),
  });
};

export const useDeleteStudioCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-courses'] });
      qc.invalidateQueries({ queryKey: ['studio-lessons'] });
    },
  });
};

export const useStudioLessons = (courseId?: string) =>
  useQuery({
    queryKey: ['studio-lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_lessons')
        .select('*')
        .eq('teacher_course_id', courseId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as StudioLesson[];
    },
    enabled: !!courseId,
  });

export const useSaveStudioLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<StudioLesson> & { teacher_account_id: string; teacher_course_id: string; title: string },
    ) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase.from('teacher_lessons').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from('teacher_lessons').insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio-lessons'] }),
  });
};

export const useDeleteStudioLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio-lessons'] }),
  });
};

/* ------------------------------------------------------------------ */
/* Tareas                                                              */
/* ------------------------------------------------------------------ */

export const useStudioAssignments = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-assignments', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudioAssignment[];
    },
    enabled: !!accountId,
  });

export const useSaveStudioAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<StudioAssignment> & { teacher_account_id: string; teacher_student_id: string; title: string },
    ) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase.from('teacher_assignments').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from('teacher_assignments').insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-assignments'] });
      qc.invalidateQueries({ queryKey: ['my-studio-assignments'] });
    },
  });
};

export const useDeleteStudioAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio-assignments'] }),
  });
};

/* ------------------------------------------------------------------ */
/* Métricas del estudio                                                */
/* ------------------------------------------------------------------ */

export const useStudioStats = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-stats', accountId],
    queryFn: async () => {
      const [students, courses, lessons, progress, assignments] = await Promise.all([
        supabase.from('teacher_students').select('id,status').eq('teacher_account_id', accountId!),
        supabase.from('teacher_courses').select('id,is_published').eq('teacher_account_id', accountId!),
        supabase.from('teacher_lessons').select('id').eq('teacher_account_id', accountId!),
        supabase
          .from('teacher_lesson_progress')
          .select('id,completed,student_user_id,updated_at')
          .eq('teacher_account_id', accountId!),
        supabase.from('teacher_assignments').select('id,status').eq('teacher_account_id', accountId!),
      ]);

      const s = students.data ?? [];
      const completed = (progress.data ?? []).filter((p) => p.completed);
      const weekAgo = Date.now() - 7 * 864e5;

      return {
        totalStudents: s.length,
        activeStudents: s.filter((x) => x.status === 'active').length,
        invitedStudents: s.filter((x) => x.status === 'invited').length,
        seatsUsed: s.filter((x) => x.status !== 'inactive').length,
        totalCourses: (courses.data ?? []).length,
        publishedCourses: (courses.data ?? []).filter((c) => c.is_published).length,
        totalLessons: (lessons.data ?? []).length,
        completedLessons: completed.length,
        completedThisWeek: completed.filter((p) => new Date(p.updated_at).getTime() > weekAgo).length,
        pendingAssignments: (assignments.data ?? []).filter((a) => a.status === 'pending').length,
      };
    },
    enabled: !!accountId,
  });

export const useStudioStudentProgress = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-student-progress', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_lesson_progress')
        .select('student_user_id,completed,updated_at')
        .eq('teacher_account_id', accountId!);
      if (error) throw error;
      const map = new Map<string, { completed: number; last: string | null }>();
      for (const row of data ?? []) {
        const entry = map.get(row.student_user_id) ?? { completed: 0, last: null };
        if (row.completed) entry.completed += 1;
        if (!entry.last || row.updated_at > entry.last) entry.last = row.updated_at;
        map.set(row.student_user_id, entry);
      }
      return map;
    },
    enabled: !!accountId,
  });

/* ------------------------------------------------------------------ */
/* Lado alumno: su estudio                                             */
/* ------------------------------------------------------------------ */

export const useMyStudioMembership = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-studio-membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('teacher_students')
        .select('*, studio:teacher_accounts(id,studio_name,primary_instrument,status)')
        .eq('student_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data as (StudioStudent & {
        studio: { id: string; studio_name: string; primary_instrument: string | null; status: string } | null;
      }) | null;
    },
    enabled: !!user?.id,
  });
};

export const useMyStudioCourses = (accountId?: string) =>
  useQuery({
    queryKey: ['my-studio-courses', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_courses')
        .select('*, teacher_lessons(*)')
        .eq('teacher_account_id', accountId!)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as (StudioCourse & { teacher_lessons: StudioLesson[] })[];
    },
    enabled: !!accountId,
  });

export const useMyStudioProgress = (accountId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-studio-progress', accountId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_lesson_progress')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .eq('student_user_id', user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!accountId && !!user?.id,
  });
};

export const useToggleStudioLesson = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      accountId,
      lessonId,
      completed,
    }: { accountId: string; lessonId: string; completed: boolean }) => {
      if (!user?.id) throw new Error('Necesitas iniciar sesión.');
      const { error } = await supabase.from('teacher_lesson_progress').upsert(
        {
          teacher_account_id: accountId,
          teacher_lesson_id: lessonId,
          student_user_id: user.id,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: 'teacher_lesson_id,student_user_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-studio-progress'] });
      qc.invalidateQueries({ queryKey: ['studio-stats'] });
    },
  });
};

export const useMyStudioAssignments = () => {
  const { data: membership } = useMyStudioMembership();
  return useQuery({
    queryKey: ['my-studio-assignments', membership?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select('*')
        .eq('teacher_student_id', membership!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudioAssignment[];
    },
    enabled: !!membership?.id,
  });
};

export const useUpdateMyAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, student_notes }: { id: string; status: string; student_notes?: string }) => {
      const { error } = await supabase
        .from('teacher_assignments')
        .update({
          status,
          student_notes,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-studio-assignments'] }),
  });
};

/* ------------------------------------------------------------------ */
/* Invitación                                                          */
/* ------------------------------------------------------------------ */

export const useStudioByInviteCode = (code?: string) =>
  useQuery({
    queryKey: ['studio-by-invite', code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_accounts')
        .select('id,studio_name,primary_instrument,bio,status')
        .eq('invite_code', code!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

export const useClaimStudioInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('claim_studio_invite', { _invite_code: code });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as {
        account_id: string | null;
        studio_name: string | null;
        joined: boolean;
        message: string;
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-studio-membership'] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export const useAllTeacherAccounts = () =>
  useQuery({
    queryKey: ['admin-teacher-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = (data ?? []).map((a) => a.id);
      let counts = new Map<string, number>();
      if (ids.length) {
        const { data: studs } = await supabase
          .from('teacher_students')
          .select('teacher_account_id,status')
          .in('teacher_account_id', ids);
        counts = (studs ?? []).reduce((acc, s) => {
          if (s.status !== 'inactive') acc.set(s.teacher_account_id, (acc.get(s.teacher_account_id) ?? 0) + 1);
          return acc;
        }, new Map<string, number>());
      }

      return (data as TeacherAccount[]).map((a) => ({ ...a, seats_used: counts.get(a.id) ?? 0 }));
    },
  });

/* ------------------------------------------------------------------ */
/* Admin: uso por maestro (métricas por rango de fechas)               */
/* ------------------------------------------------------------------ */

export interface TeacherUsageRow {
  id: string;
  studio_name: string;
  contact_email: string | null;
  primary_instrument: string | null;
  plan: string;
  status: string;
  mrr: number;
  seat_limit: number;
  seats_used: number;
  seats_pct: number;
  invites_sent: number;
  students_joined: number;
  courses: number;
  published_courses: number;
  lessons: number;
  lessons_completed: number;
  assignments: number;
  assignments_completed: number;
  last_activity: string | null;
  created_at: string;
}

export const useTeacherUsageMetrics = (from?: string, to?: string) =>
  useQuery({
    queryKey: ['admin-teacher-usage', from, to],
    queryFn: async () => {
      const inRange = (iso?: string | null) => {
        if (!iso) return false;
        const t = new Date(iso).getTime();
        if (from && t < new Date(from).getTime()) return false;
        if (to && t > new Date(to).getTime() + 864e5) return false;
        return true;
      };

      const [accountsRes, studentsRes, coursesRes, lessonsRes, progressRes, assignmentsRes] = await Promise.all([
        supabase.from('teacher_accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('teacher_students').select('teacher_account_id,status,invited_at,joined_at,created_at'),
        supabase.from('teacher_courses').select('teacher_account_id,is_published,created_at'),
        supabase.from('teacher_lessons').select('teacher_account_id,created_at'),
        supabase.from('teacher_lesson_progress').select('teacher_account_id,completed,updated_at'),
        supabase.from('teacher_assignments').select('teacher_account_id,status,created_at,completed_at'),
      ]);

      const accounts = (accountsRes.data ?? []) as TeacherAccount[];
      const students = studentsRes.data ?? [];
      const courses = coursesRes.data ?? [];
      const lessons = lessonsRes.data ?? [];
      const progress = progressRes.data ?? [];
      const assignments = assignmentsRes.data ?? [];

      const rows: TeacherUsageRow[] = accounts.map((a) => {
        const mine = students.filter((s) => s.teacher_account_id === a.id);
        const seatsUsed = mine.filter((s) => s.status !== 'inactive').length;
        const myProgress = progress.filter((p) => p.teacher_account_id === a.id && inRange(p.updated_at));
        const myAssignments = assignments.filter((x) => x.teacher_account_id === a.id && inRange(x.created_at));
        const lastActivity = progress
          .filter((p) => p.teacher_account_id === a.id)
          .reduce<string | null>((acc, p) => (!acc || p.updated_at > acc ? p.updated_at : acc), null);
        const plan = (a.plan as TeacherPlanId) ?? 'starter';

        return {
          id: a.id,
          studio_name: a.studio_name,
          contact_email: a.contact_email,
          primary_instrument: a.primary_instrument,
          plan,
          status: a.status,
          mrr: a.status === 'active' ? (TEACHER_PLAN_MAP[plan]?.price ?? 0) : 0,
          seat_limit: a.seat_limit,
          seats_used: seatsUsed,
          seats_pct: a.seat_limit ? Math.round((seatsUsed / a.seat_limit) * 100) : 0,
          invites_sent: mine.filter((s) => inRange(s.invited_at ?? s.created_at)).length,
          students_joined: mine.filter((s) => inRange(s.joined_at)).length,
          courses: courses.filter((c) => c.teacher_account_id === a.id).length,
          published_courses: courses.filter((c) => c.teacher_account_id === a.id && c.is_published).length,
          lessons: lessons.filter((l) => l.teacher_account_id === a.id).length,
          lessons_completed: myProgress.filter((p) => p.completed).length,
          assignments: myAssignments.length,
          assignments_completed: myAssignments.filter((x) => x.status !== 'pending').length,
          last_activity: lastActivity,
          created_at: a.created_at,
        };
      });

      const totals = {
        accounts: rows.length,
        active: rows.filter((r) => r.status === 'active').length,
        trial: rows.filter((r) => r.status === 'trial').length,
        mrr: rows.reduce((s, r) => s + r.mrr, 0),
        trialMrr: rows
          .filter((r) => r.status === 'trial')
          .reduce((s, r) => s + (TEACHER_PLAN_MAP[(r.plan as TeacherPlanId) ?? 'starter']?.price ?? 0), 0),
        seatsUsed: rows.reduce((s, r) => s + r.seats_used, 0),
        seatsTotal: rows.reduce((s, r) => s + r.seat_limit, 0),
        invites: rows.reduce((s, r) => s + r.invites_sent, 0),
        joined: rows.reduce((s, r) => s + r.students_joined, 0),
        lessonsCompleted: rows.reduce((s, r) => s + r.lessons_completed, 0),
        assignments: rows.reduce((s, r) => s + r.assignments, 0),
      };

      return { rows, totals };
    },
  });

/* ------------------------------------------------------------------ */
/* Estudio: progreso detallado por alumno / curso                      */
/* ------------------------------------------------------------------ */

export const useStudioAllLessons = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-all-lessons', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_lessons')
        .select('id,title,teacher_course_id,sort_order')
        .eq('teacher_account_id', accountId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!accountId,
  });

export const useStudioProgressRows = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-progress-rows', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_lesson_progress')
        .select('teacher_lesson_id,student_user_id,completed,updated_at')
        .eq('teacher_account_id', accountId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!accountId,
  });

/* ------------------------------------------------------------------ */
/* Clases en vivo del estudio (Zoom)                                   */
/* ------------------------------------------------------------------ */

export type StudioLiveClass = Tables<'teacher_live_classes'>;
export type StudioAnnouncement = Tables<'teacher_announcements'>;
export type StudioClassRegistration = Tables<'teacher_class_registrations'>;

export const useStudioLiveClasses = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-live-classes', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_live_classes')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as StudioLiveClass[];
    },
    enabled: !!accountId,
  });

export const useSaveStudioLiveClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<StudioLiveClass> & { teacher_account_id: string; title: string; scheduled_at: string },
    ) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase
          .from('teacher_live_classes')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as StudioLiveClass;
      }
      const { data, error } = await supabase.from('teacher_live_classes').insert(rest).select().single();
      if (error) throw error;
      return data as StudioLiveClass;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-live-classes'] });
      qc.invalidateQueries({ queryKey: ['my-studio-live-classes'] });
    },
  });
};

export const useDeleteStudioLiveClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_live_classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-live-classes'] });
      qc.invalidateQueries({ queryKey: ['my-studio-live-classes'] });
    },
  });
};

export const useStudioClassRegistrations = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-class-registrations', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_class_registrations')
        .select('*')
        .eq('teacher_account_id', accountId!);
      if (error) throw error;
      return data as StudioClassRegistration[];
    },
    enabled: !!accountId,
  });

/* ------------------------------------------------------------------ */
/* Avisos / notificaciones del estudio                                 */
/* ------------------------------------------------------------------ */

export const useStudioAnnouncements = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-announcements', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_announcements')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudioAnnouncement[];
    },
    enabled: !!accountId,
  });

export const useSaveStudioAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<StudioAnnouncement> & { teacher_account_id: string; title: string; body: string },
    ) => {
      const { id, ...rest } = input;
      if (id) {
        const { data, error } = await supabase
          .from('teacher_announcements')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as StudioAnnouncement;
      }
      const { data, error } = await supabase.from('teacher_announcements').insert(rest).select().single();
      if (error) throw error;
      return data as StudioAnnouncement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-announcements'] });
      qc.invalidateQueries({ queryKey: ['my-studio-announcements'] });
    },
  });
};

export const useDeleteStudioAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-announcements'] });
      qc.invalidateQueries({ queryKey: ['my-studio-announcements'] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Lado alumno: clases en vivo y avisos                                */
/* ------------------------------------------------------------------ */

export const useMyStudioLiveClasses = (accountId?: string) =>
  useQuery({
    queryKey: ['my-studio-live-classes', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_live_classes')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .eq('is_published', true)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as StudioLiveClass[];
    },
    enabled: !!accountId,
  });

export const useMyStudioAnnouncements = (accountId?: string) =>
  useQuery({
    queryKey: ['my-studio-announcements', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_announcements')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudioAnnouncement[];
    },
    enabled: !!accountId,
  });

export const useMyClassRegistrations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-class-registrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_class_registrations')
        .select('*')
        .eq('student_user_id', user!.id);
      if (error) throw error;
      return data as StudioClassRegistration[];
    },
    enabled: !!user?.id,
  });
};

export const useRegisterToStudioClass = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ accountId, classId }: { accountId: string; classId: string }) => {
      if (!user?.id) throw new Error('Necesitas iniciar sesión.');
      const { error } = await supabase.from('teacher_class_registrations').insert({
        teacher_account_id: accountId,
        live_class_id: classId,
        student_user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-class-registrations'] }),
  });
};

/* ------------------------------------------------------------------ */
/* Estado de suscripción del estudio                                   */
/* ------------------------------------------------------------------ */

export interface StudioStatus {
  status: string;
  plan: string;
  seat_limit: number;
  seats_used: number;
  days_left: number | null;
  is_active: boolean;
}

export const useStudioStatus = (accountId?: string) =>
  useQuery<StudioStatus | null>({
    queryKey: ['studio-status', accountId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('studio_status', { _account_id: accountId });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as StudioStatus | null;
    },
    enabled: !!accountId,
    staleTime: 60_000,
  });

/** Traduce errores de la base de datos del estudio a mensajes claros. */
export const studioErrorMessage = (e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e ?? '');
  if (msg.includes('seat_limit_reached'))
    return 'Ya usaste todos los cupos de tu plan. Sube de plan para agregar más alumnos.';
  if (msg.includes('studio_inactive'))
    return 'Tu suscripción de estudio no está activa. Renueva tu plan para seguir agregando alumnos.';
  if (msg.includes('duplicate key'))
    return 'Ese alumno ya está en tu estudio.';
  return msg || 'Intenta de nuevo.';
};
