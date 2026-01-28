import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LessonNote {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  is_bookmark: boolean;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export const useLessonNotes = (lessonId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lesson-notes', lessonId, user?.id],
    queryFn: async () => {
      if (!lessonId || !user?.id) return [];

      const { data, error } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LessonNote[];
    },
    enabled: !!lessonId && !!user?.id,
  });
};

export const useAllBookmarks = (courseId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-bookmarks', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user?.id) return [];

      // Get all lesson IDs for this course
      const { data: modules } = await supabase
        .from('course_modules')
        .select('lessons(id, title)')
        .eq('course_id', courseId);

      const lessonIds = modules?.flatMap(m => 
        (m.lessons as { id: string; title: string }[])?.map(l => l.id) || []
      ) || [];

      if (lessonIds.length === 0) return [];

      const { data, error } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_bookmark', true)
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LessonNote[];
    },
    enabled: !!courseId && !!user?.id,
  });
};

export const useCreateNote = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      content,
      isBookmark = false,
      timestampSeconds = null,
    }: {
      lessonId: string;
      content: string;
      isBookmark?: boolean;
      timestampSeconds?: number | null;
    }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('lesson_notes')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          content,
          is_bookmark: isBookmark,
          timestamp_seconds: timestampSeconds,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes', variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course-bookmarks'] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      content,
      isBookmark,
    }: {
      noteId: string;
      content?: string;
      isBookmark?: boolean;
    }) => {
      const updates: Partial<LessonNote> = {};
      if (content !== undefined) updates.content = content;
      if (isBookmark !== undefined) updates.is_bookmark = isBookmark;

      const { data, error } = await supabase
        .from('lesson_notes')
        .update(updates)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes', data.lesson_id] });
      queryClient.invalidateQueries({ queryKey: ['course-bookmarks'] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, lessonId }: { noteId: string; lessonId: string }) => {
      const { error } = await supabase
        .from('lesson_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return { lessonId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes', data.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course-bookmarks'] });
    },
  });
};
