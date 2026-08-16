import { supabase } from '@/integrations/supabase/client';
import { isValidInstrument, type InstrumentSlug } from '@/lib/instrument-access';

const PENDING_KEY = 'acorde:pending-instrument';

export const savePendingInstrument = (slug: string | null | undefined) => {
  if (!slug) return;
  if (!isValidInstrument(slug)) return;
  try { sessionStorage.setItem(PENDING_KEY, slug); } catch { /* noop */ }
};

export const readPendingInstrument = (): InstrumentSlug | null => {
  try {
    const v = sessionStorage.getItem(PENDING_KEY);
    return isValidInstrument(v) ? v : null;
  } catch {
    return null;
  }
};

export const clearPendingInstrument = () => {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* noop */ }
};

/**
 * Applies any pending instrument stored during signup to the user's profile
 * (only if they don't already have one). Returns the effective instrument.
 */
export const applyPendingInstrument = async (userId: string): Promise<InstrumentSlug | null> => {
  // Read current profile
  const { data: prof } = await supabase
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select('primary_instrument' as any)
    .eq('user_id', userId)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const current = (prof as any)?.primary_instrument as string | null | undefined;
  if (isValidInstrument(current)) {
    clearPendingInstrument();
    return current;
  }

  const pending = readPendingInstrument();
  if (!pending) return null;

  const { error } = await supabase
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ primary_instrument: pending, enabled_instruments: [pending] } as any)
    .eq('user_id', userId);
  if (error) return null;
  clearPendingInstrument();
  return pending;
};

export const resolveDestination = async (userId: string): Promise<string> => {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  const list = (roles ?? []).map((r) => r.role);
  if (list.includes('admin')) return '/admin';
  if (list.includes('instructor')) return '/instructor';

  // Sin membresía real (prueba/suscripción/estudio) el alumno NO entra al portal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entData, error: entError } = await (supabase as any).rpc(
    'current_entitlement',
    { _user_id: userId },
  );
  const ent = Array.isArray(entData) ? entData[0] : entData;
  const status = ent?.status as string | undefined;
  if (entError || !status || status === 'inactive') return '/empezar';

  // Try to apply any pending instrument selection from the auth flow
  const instrument = await applyPendingInstrument(userId);
  if (instrument === 'production') return '/portal/produccion';
  return '/portal';
};
