import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type Instrument = 'piano' | 'guitar';

export interface EnabledInstrumentsData {
  instruments: Instrument[];
  hasPiano: boolean;
  hasGuitar: boolean;
  /** True when the user has not selected any instrument yet (treated as full access by default). */
  isUnset: boolean;
}

/**
 * Returns the instruments the current student has enabled.
 * - If the array is empty (legacy/new user), defaults to both for backward compatibility
 *   but flags `isUnset=true` so the UI can nudge the user to choose.
 */
export const useEnabledInstruments = () => {
  const { user } = useAuth();

  return useQuery<EnabledInstrumentsData>({
    queryKey: ['enabled-instruments', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { instruments: [], hasPiano: false, hasGuitar: false, isUnset: true };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('enabled_instruments')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = ((data as any)?.enabled_instruments ?? []) as string[];
      const valid = raw.filter((i): i is Instrument => i === 'piano' || i === 'guitar');

      // Empty = not configured yet → treat as full access to avoid breaking UX.
      const effective: Instrument[] = valid.length > 0 ? valid : ['piano', 'guitar'];

      return {
        instruments: effective,
        hasPiano: effective.includes('piano'),
        hasGuitar: effective.includes('guitar'),
        isUnset: valid.length === 0,
      };
    },
    enabled: !!user?.id,
  });
};

export const useUpdateEnabledInstruments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (instruments: Instrument[]) => {
      if (!user?.id) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ enabled_instruments: instruments } as any)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enabled-instruments'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      toast({
        title: 'Instrumentos actualizados',
        description: 'Tus herramientas de IA se han ajustado.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar tus instrumentos.',
        variant: 'destructive',
      });
    },
  });
};
