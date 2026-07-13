import { supabase } from '@/integrations/supabase/client';

export const resolveDestination = async (userId: string): Promise<string> => {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  const list = (roles ?? []).map((r) => r.role);
  if (list.includes('admin')) return '/admin';
  if (list.includes('instructor')) return '/instructor';
  return '/portal';
};
