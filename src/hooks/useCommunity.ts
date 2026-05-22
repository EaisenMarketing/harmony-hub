import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PostTag = 'general' | 'progress' | 'question' | 'cover' | 'tip';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  tag: PostTag;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null };
  likes_count?: number;
  liked_by_me?: boolean;
  comments_count?: number;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null };
}

export const useCommunityFeed = (tagFilter?: PostTag | 'all') => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['community-feed', tagFilter, user?.id],
    queryFn: async () => {
      let q = supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (tagFilter && tagFilter !== 'all') q = q.eq('tag', tagFilter);
      const { data: posts, error } = await q;
      if (error) throw error;
      if (!posts?.length) return [];

      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const postIds = posts.map((p) => p.id);

      const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds),
        supabase.from('community_likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('community_comments').select('post_id').in('post_id', postIds),
      ]);

      return posts.map((p): CommunityPost => {
        const postLikes = likes?.filter((l) => l.post_id === p.id) || [];
        return {
          ...p,
          tag: p.tag as PostTag,
          author: profiles?.find((pr) => pr.user_id === p.user_id) || undefined,
          likes_count: postLikes.length,
          liked_by_me: !!postLikes.find((l) => l.user_id === user?.id),
          comments_count: comments?.filter((c) => c.post_id === p.id).length || 0,
        };
      });
    },
    enabled: !!user,
  });
};

export const usePostComments = (postId: string | null) => {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!data?.length) return [] as CommunityComment[];
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      return data.map((c) => ({
        ...c,
        author: profiles?.find((p) => p.user_id === c.user_id),
      })) as CommunityComment[];
    },
    enabled: !!postId,
  });
};

export const useCreatePost = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { content: string; image_url?: string | null; tag: PostTag }) => {
      const { error } = await supabase.from('community_posts').insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-feed'] }),
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('community_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-feed'] }),
  });
};

export const useToggleLike = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', user!.id);
      } else {
        await supabase.from('community_likes').insert({ post_id: postId, user_id: user!.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-feed'] }),
  });
};

export const useAddComment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { error } = await supabase
        .from('community_comments')
        .insert({ post_id: postId, user_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['post-comments', vars.postId] });
      qc.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
};

export const useDeleteComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; postId: string }) => {
      const { error } = await supabase.from('community_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['post-comments', vars.postId] });
      qc.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
};

export const uploadCommunityImage = async (userId: string, file: File): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('community-media').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('community-media').getPublicUrl(path);
  return data.publicUrl;
};
