import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Instrument = 'guitar' | 'piano' | 'drums';

export interface TeacherQuestion {
  id: string;
  student_id: string;
  instructor_id: string | null;
  instrument: Instrument;
  title: string;
  body: string;
  image_url: string | null;
  status: 'open' | 'answered';
  answer: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
}

export const useMyQuestions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-questions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_questions')
        .select('*')
        .eq('student_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TeacherQuestion[];
    },
    enabled: !!user,
  });
};

export const useInstructorInbox = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['instructor-inbox', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_questions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TeacherQuestion[];
    },
    enabled: !!user,
  });
};

export const useAvailableInstructors = (instrument?: Instrument) => {
  return useQuery({
    queryKey: ['available-instructors', instrument],
    queryFn: async () => {
      let q = supabase
        .from('instructor_profiles')
        .select('user_id, instrument, specialization')
        .eq('status', 'approved');
      if (instrument) q = q.eq('instrument', instrument);
      const { data, error } = await q;
      if (error) throw error;
      const ids = (data || []).map((i) => i.user_id);
      if (!ids.length) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', ids);
      return (data || []).map((i) => ({
        ...i,
        profile: profiles?.find((p) => p.user_id === i.user_id),
      }));
    },
    enabled: !!instrument,
  });
};

export const useCreateQuestion = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      instrument: Instrument;
      instructor_id: string | null;
      title: string;
      body: string;
      image_url?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('teacher_questions')
        .insert({ ...input, student_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      // Fire-and-forget email notification (works once email domain is configured)
      supabase.functions
        .invoke('notify-teacher-question', { body: { question_id: data.id } })
        .catch(() => {});
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-questions'] }),
  });
};

export const useAnswerQuestion = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const { error } = await supabase
        .from('teacher_questions')
        .update({
          answer,
          status: 'answered',
          answered_by: user!.id,
          answered_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructor-inbox'] });
      qc.invalidateQueries({ queryKey: ['my-questions'] });
    },
  });
};
