import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isValidInstrument, type InstrumentSlug } from '@/lib/instrument-access';

export const useUserInstrument = () => {
  const { user } = useAuth();

  return useQuery<{ instrument: InstrumentSlug | null; loaded: boolean }>({
    queryKey: ['user-instrument', user?.id],
    queryFn: async () => {
      if (!user?.id) return { instrument: null, loaded: true };
      const { data, error } = await supabase
        .from('profiles')
        .select('primary_instrument')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (data as any)?.primary_instrument;
      return {
        instrument: isValidInstrument(raw) ? raw : null,
        loaded: true,
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
};

export const useSetUserInstrument = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (instrument: InstrumentSlug) => {
      if (!user?.id) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ primary_instrument: instrument, enabled_instruments: [instrument] } as any)
        .eq('user_id', user.id);
      if (error) throw error;
      return instrument;
    },
    onSuccess: (instrument) => {
      qc.invalidateQueries({ queryKey: ['user-instrument'] });
      qc.invalidateQueries({ queryKey: ['student-profile'] });
      qc.invalidateQueries({ queryKey: ['enabled-instruments'] });
      qc.invalidateQueries({ queryKey: ['student-courses'] });
      qc.invalidateQueries({ queryKey: ['available-courses'] });
      toast({ title: 'Instrumento activado', description: `Ya tienes acceso a tu contenido de ${instrument}.` });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo guardar tu instrumento.', variant: 'destructive' });
    },
  });
};
