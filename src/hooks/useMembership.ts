import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { browserTimezone, type PlanKeyNew } from '@/lib/membership';
import type { InstrumentSlug } from '@/lib/instrument-access';

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

export interface Entitlement {
  plan_key: PlanKeyNew | null;
  status: 'trialing' | 'active' | 'inactive';
  instrument_slug: InstrumentSlug | null;
  level_key: string | null;
  ai_tool_limit: number | null;
  allow_practice_submissions: boolean;
  allow_teacher_feedback: boolean;
  advanced_content: boolean;
  trial_days_left: number | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  is_admin: boolean;
}

const EMPTY: Entitlement = {
  plan_key: null, status: 'inactive', instrument_slug: null, level_key: null,
  ai_tool_limit: 0, allow_practice_submissions: false, allow_teacher_feedback: false,
  advanced_content: false, trial_days_left: null, trial_ends_at: null,
  current_period_end: null, is_admin: false,
};

/** Estado real del alumno, calculado en la base de datos. */
export const useEntitlement = () => {
  const { user } = useAuth();
  return useQuery<Entitlement>({
    queryKey: ['entitlement', user?.id],
    queryFn: async () => {
      if (!user?.id) return EMPTY;
      const { data, error } = await db.rpc('current_entitlement', { _user_id: user.id });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return { ...EMPTY, ...(row ?? {}) } as Entitlement;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
};

export const usePlansCatalog = () =>
  useQuery({
    queryKey: ['plans-catalog'],
    queryFn: async () => {
      const { data, error } = await db.from('plans').select('*').eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data as any[];
    },
    staleTime: 5 * 60_000,
  });

export const useInstrumentsCatalog = () =>
  useQuery({
    queryKey: ['instruments-catalog'],
    queryFn: async () => {
      const { data, error } = await db.from('instruments').select('*').eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data as { slug: InstrumentSlug; name: string; emoji: string | null }[];
    },
    staleTime: 5 * 60_000,
  });

export const useAiToolsCatalog = () =>
  useQuery({
    queryKey: ['ai-tools-catalog'],
    queryFn: async () => {
      const [tools, perms] = await Promise.all([
        db.from('ai_tools').select('*').eq('is_active', true).order('sort_order'),
        db.from('plan_ai_tools').select('*'),
      ]);
      if (tools.error) throw tools.error;
      if (perms.error) throw perms.error;
      return { tools: tools.data as any[], perms: perms.data as any[] };
    },
    staleTime: 5 * 60_000,
  });

/** Grupos compatibles con instrumento + nivel, con cupos. */
export const useCompatibleGroups = (instrument?: string | null, level?: string | null) =>
  useQuery({
    queryKey: ['compatible-groups', instrument, level],
    queryFn: async () => {
      let q = db.from('groups').select('*').eq('is_active', true).eq('instrument_slug', instrument);
      if (level) q = q.eq('level_key', level);
      const { data, error } = await q.order('weekday');
      if (error) throw error;
      const groups = (data ?? []) as any[];
      if (!groups.length) return [];
      const { data: seats } = await db
        .from('group_students')
        .select('group_id, membership_status, left_at')
        .in('group_id', groups.map((g) => g.id));
      return groups.map((g) => {
        const rows = (seats ?? []).filter((s: any) => s.group_id === g.id && !s.left_at);
        const taken = rows.length;
        const trials = rows.filter((s: any) => s.membership_status === 'trial').length;
        return {
          ...g,
          seats_taken: taken,
          seats_left: Math.max(0, g.capacity - taken),
          trial_seats_left: Math.max(0, g.trial_slots_limit - trials),
        };
      });
    },
    enabled: !!instrument,
    staleTime: 30_000,
  });

/** Grupo(s) del alumno + próxima clase. */
export const useMyGroups = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-groups', user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from('group_students')
        .select('*, groups(*)')
        .eq('user_id', user!.id)
        .is('left_at', null);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
};

export const useNextClassSession = () => {
  const { data: myGroups } = useMyGroups();
  const groupIds = (myGroups ?? []).map((g: any) => g.group_id);
  return useQuery({
    queryKey: ['next-class-session', groupIds],
    queryFn: async () => {
      if (!groupIds.length) return null;
      const { data, error } = await db
        .from('class_sessions')
        .select('*, groups(*)')
        .in('group_id', groupIds)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as any;
    },
    enabled: groupIds.length > 0,
    staleTime: 30_000,
  });
};

export const useStartTrial = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ plan, instrument }: { plan: PlanKeyNew; instrument?: InstrumentSlug | null }) => {
      const { data, error } = await db.rpc('start_trial', { _plan_key: plan, _instrument: instrument ?? null });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) throw new Error(row?.message ?? 'trial_error');
      return row as { ok: boolean; message: string; trial_ends_at: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entitlement'] });
      qc.invalidateQueries({ queryKey: ['my-trial'] });
    },
    onError: (e: Error) => {
      const msg = e.message === 'trial_already_used'
        ? 'Ya utilizaste tu prueba gratuita. Puedes suscribirte directamente.'
        : 'No pudimos iniciar tu prueba gratuita.';
      toast({ title: 'Prueba gratuita', description: msg, variant: 'destructive' });
    },
  });
};

export const useCanStartTrial = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['can-start-trial', user?.id],
    queryFn: async () => {
      const { data, error } = await db.rpc('can_start_trial', { _user_id: user!.id });
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id,
  });
};

export const useMyTrial = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-trial', user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from('trials').select('*').eq('user_id', user!.id)
        .order('started_at', { ascending: false }).limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as any;
    },
    enabled: !!user?.id,
  });
};

/** Cambia el instrumento activo respetando el límite de 1 y el cooldown de 30 días. */
export const useSetActiveInstrument = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ instrument, level }: { instrument: InstrumentSlug; level?: string | null }) => {
      const { data, error } = await db.rpc('set_active_instrument', { _instrument: instrument, _level: level ?? null });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) throw new Error(row?.message ?? 'error');
      return row;
    },
    onSuccess: () => {
      ['entitlement', 'user-instrument', 'student-profile', 'student-courses', 'available-courses', 'my-groups']
        .forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e: Error) => {
      toast({
        title: 'No se pudo cambiar el instrumento',
        description: e.message === 'change_cooldown'
          ? 'Solo puedes cambiar de instrumento una vez cada 30 días.'
          : 'Intenta de nuevo más tarde.',
        variant: 'destructive',
      });
    },
  });
};

export const useJoinGroup = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await db.rpc('join_group', { _group_id: groupId });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) throw new Error(row?.message ?? 'error');
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-groups'] });
      qc.invalidateQueries({ queryKey: ['compatible-groups'] });
    },
    onError: (e: Error) => {
      const map: Record<string, string> = {
        group_full: 'Ese grupo ya está lleno.',
        trial_slots_full: 'Ese grupo ya alcanzó su límite de alumnos en prueba.',
        instrument_mismatch: 'Ese grupo pertenece a otro instrumento.',
      };
      toast({ title: 'No pudimos inscribirte', description: map[e.message] ?? 'Intenta con otro horario.', variant: 'destructive' });
    },
  });
};

export const useSaveTimezone = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tz?: string) => {
      if (!user?.id) return;
      const { error } = await db.from('profiles').update({ timezone: tz ?? browserTimezone() }).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student-profile'] }),
  });
};

export const useSavePaymentMethod = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { brand?: string; last4?: string; exp_month?: number; exp_year?: number }) => {
      if (!user?.id) throw new Error('No user');
      const { error } = await db.from('payment_methods').insert({ user_id: user.id, provider: 'pending', ...payload });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  });
};

export const useMyPaymentMethods = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: async () => {
      const { data, error } = await db.from('payment_methods').select('*').eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!user?.id,
  });
};

/** Cancelación: durante trial no hay cobro; después se mantiene el acceso al periodo pagado. */
export const useCancelMembership = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      const { data: trial } = await db
        .from('trials').select('*').eq('user_id', user.id).eq('status', 'trialing').limit(1);
      if (trial?.length) {
        const { error } = await db.from('trials')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('id', trial[0].id);
        if (error) throw error;
        await db.from('subscription_events').insert({
          user_id: user.id, event_type: 'trial_canceled', plan_key: trial[0].plan_key,
        });
        return 'trial_canceled';
      }
      const { error } = await db.from('subscription_events').insert({
        user_id: user.id, event_type: 'cancel_requested',
      });
      if (error) throw error;
      return 'cancel_at_period_end';
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['entitlement'] });
      qc.invalidateQueries({ queryKey: ['my-trial'] });
      toast({
        title: result === 'trial_canceled' ? 'Prueba cancelada' : 'Cancelación registrada',
        description: result === 'trial_canceled'
          ? 'Tu prueba ha sido cancelada. No se realizará ningún cobro.'
          : 'Mantendrás acceso hasta el final del periodo pagado.',
      });
    },
  });
};

export const useChangePlan = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (plan: PlanKeyNew) => {
      if (!user?.id) throw new Error('No user');
      const { data: trial } = await db
        .from('trials').select('*').eq('user_id', user.id).eq('status', 'trialing').limit(1);
      if (trial?.length) {
        const { error } = await db.from('trials').update({ plan_key: plan }).eq('id', trial[0].id);
        if (error) throw error;
      }
      await db.from('subscription_events').insert({ user_id: user.id, event_type: 'plan_changed', plan_key: plan });
      return plan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entitlement'] });
      qc.invalidateQueries({ queryKey: ['my-trial'] });
      toast({ title: 'Plan actualizado', description: 'Tu instrumento se mantiene igual.' });
    },
  });
};

export const useBuyPrivateLesson = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ instrument, type, sessions, amountUsd }:
      { instrument: InstrumentSlug; type: 'single' | 'pack4'; sessions: number; amountUsd: number }) => {
      if (!user?.id) throw new Error('No user');
      const { error } = await db.from('private_lesson_orders').insert({
        user_id: user.id, instrument_slug: instrument, package_type: type,
        sessions_total: sessions, amount_cents: Math.round(amountUsd * 100), status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private-lessons'] });
      toast({ title: 'Solicitud registrada', description: 'Te contactaremos para agendar y completar el pago.' });
    },
  });
};

export const useMyPrivateLessons = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['private-lessons', user?.id],
    queryFn: async () => {
      const { data, error } = await db.from('private_lesson_orders').select('*')
        .eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!user?.id,
  });
};

/* ============ MAESTRO ============ */
export const useTeacherGroups = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['teacher-groups', user?.id],
    queryFn: async () => {
      const { data: groups, error } = await db.from('groups').select('*')
        .eq('teacher_user_id', user!.id).order('weekday');
      if (error) throw error;
      const list = (groups ?? []) as any[];
      if (!list.length) return [];
      const { data: students } = await db
        .from('group_students').select('*').in('group_id', list.map((g) => g.id)).is('left_at', null);
      const ids = [...new Set((students ?? []).map((s: any) => s.user_id))];
      const { data: profs } = ids.length
        ? await db.from('profiles').select('user_id, full_name, timezone').in('user_id', ids)
        : { data: [] };
      return list.map((g) => ({
        ...g,
        students: (students ?? [])
          .filter((s: any) => s.group_id === g.id)
          .map((s: any) => ({
            ...s,
            full_name: (profs ?? []).find((p: any) => p.user_id === s.user_id)?.full_name ?? 'Alumno',
          })),
      }));
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
};

/* ============ ADMIN ============ */
export const useTrialMetrics = (from?: string, to?: string) =>
  useQuery({
    queryKey: ['trial-metrics', from, to],
    queryFn: async () => {
      let q = db.from('trials').select('*');
      if (from) q = q.gte('started_at', from);
      if (to) q = q.lte('started_at', to);
      const { data, error } = await q;
      if (error) throw error;
      const trials = (data ?? []) as any[];
      const ids = [...new Set(trials.map((t) => t.user_id))];
      const { data: profs } = ids.length
        ? await db.from('profiles').select('user_id, full_name, country').in('user_id', ids)
        : { data: [] };
      const { data: gs } = ids.length
        ? await db.from('group_students').select('user_id, group_id, groups(code, teacher_name)').in('user_id', ids)
        : { data: [] };

      const rows = trials.map((t) => {
        const p = (profs ?? []).find((x: any) => x.user_id === t.user_id);
        const g = (gs ?? []).find((x: any) => x.user_id === t.user_id);
        return {
          ...t,
          full_name: p?.full_name ?? '—',
          country: p?.country ?? '—',
          group_code: g?.groups?.code ?? '—',
          teacher_name: g?.groups?.teacher_name ?? '—',
        };
      });

      const total = rows.length;
      const active = rows.filter((r) => r.status === 'trialing' && new Date(r.ends_at) > new Date()).length;
      const canceled = rows.filter((r) => r.status === 'canceled').length;
      const converted = rows.filter((r) => r.status === 'converted').length;

      const groupBy = (key: string) => {
        const map = new Map<string, { total: number; converted: number }>();
        rows.forEach((r) => {
          const k = String((r as any)[key] ?? '—');
          const cur = map.get(k) ?? { total: 0, converted: 0 };
          cur.total += 1;
          if (r.status === 'converted') cur.converted += 1;
          map.set(k, cur);
        });
        return [...map.entries()].map(([label, v]) => ({
          label, ...v, rate: v.total ? Math.round((v.converted / v.total) * 100) : 0,
        }));
      };

      return {
        rows, total, active, canceled, converted,
        conversionRate: total ? Math.round((converted / total) * 100) : 0,
        byInstrument: groupBy('instrument_slug'),
        byPlan: groupBy('plan_key'),
        byCountry: groupBy('country'),
        byTeacher: groupBy('teacher_name'),
        byGroup: groupBy('group_code'),
      };
    },
    staleTime: 60_000,
  });

export const useAdminGroups = () =>
  useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => {
      const { data, error } = await db.from('groups').select('*').order('instrument_slug');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useSaveGroupTrialLimit = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, limit }: { id: string; limit: number }) => {
      const { error } = await db.from('groups').update({ trial_slots_limit: limit }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-groups'] });
      toast({ title: 'Límite actualizado' });
    },
  });
};
