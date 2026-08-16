import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ScoreContent, ScoreDoc, ScoreInstrument } from '@/lib/score/model';

export interface ScoreRow {
  id: string;
  title: string;
  instrument: string;
  key_signature: string;
  time_signature: string;
  tempo: number;
  level: string | null;
  description: string | null;
  content: ScoreContent;
  is_public: boolean;
  share_code: string;
  updated_at: string;
  created_at: string;
}

const toDoc = (r: ScoreRow): ScoreDoc => ({
  id: r.id,
  title: r.title,
  instrument: r.instrument as ScoreInstrument,
  key_signature: r.key_signature,
  time_signature: r.time_signature,
  tempo: r.tempo,
  level: r.level,
  description: r.description,
  content: (r.content ?? { measures: [] }) as ScoreContent,
  is_public: r.is_public,
  share_code: r.share_code,
});

export const useMyScores = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['scores', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as ScoreRow[]).map(toDoc);
    },
  });
};

export const useScoreByShareCode = (code?: string) =>
  useQuery({
    queryKey: ['score-share', code],
    enabled: !!code,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('share_code', code!)
        .maybeSingle();
      if (error) throw error;
      return data ? toDoc(data as unknown as ScoreRow) : null;
    },
  });

export const useSaveScore = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (doc: ScoreDoc) => {
      if (!user?.id) throw new Error('No user');
      const payload = {
        user_id: user.id,
        title: doc.title,
        instrument: doc.instrument,
        key_signature: doc.key_signature,
        time_signature: doc.time_signature,
        tempo: doc.tempo,
        level: doc.level ?? null,
        description: doc.description ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: doc.content as any,
        is_public: !!doc.is_public,
      };
      if (doc.id) {
        const { data, error } = await supabase
          .from('scores').update(payload).eq('id', doc.id).select('*').single();
        if (error) throw error;
        return toDoc(data as unknown as ScoreRow);
      }
      const { data, error } = await supabase
        .from('scores').insert(payload).select('*').single();
      if (error) throw error;
      return toDoc(data as unknown as ScoreRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scores'] });
      toast({ title: 'Partitura guardada' });
    },
    onError: () => toast({ title: 'Error', description: 'No se pudo guardar la partitura.', variant: 'destructive' }),
  });
};

export const useDeleteScore = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scores'] });
      toast({ title: 'Partitura eliminada' });
    },
  });
};

/** Genera una partitura con IA a partir de un texto, acordes o una canción. */
export const useGenerateScore = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      prompt: string;
      youtubeUrl?: string;
      instrument: ScoreInstrument;
      level?: string;
      measures?: number;
      key?: string;
      time?: string;
      tempo?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-score', { body: input });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error?: string }).error);
      return data as { doc: ScoreDoc; notes?: string };
    },
    onError: (e: Error) =>
      toast({ title: 'No se pudo generar', description: e.message || 'Intenta de nuevo.', variant: 'destructive' }),
  });
};
