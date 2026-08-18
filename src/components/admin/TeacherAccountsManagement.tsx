import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllTeacherAccounts, useUpdateTeacherAccount } from '@/hooks/useTeacherStudio';
import {
  TEACHER_PLANS,
  TEACHER_PLAN_MAP,
  TEACHER_STATUS_LABEL,
  studioInviteUrl,
  type TeacherPlanId,
} from '@/lib/teacher-plans';
import { toast } from 'sonner';
import { Copy, GraduationCap, Search, Users, Wallet } from 'lucide-react';

const STATUSES = ['trial', 'active', 'suspended', 'canceled'] as const;

const statusVariant = (status: string) =>
  status === 'active'
    ? 'bg-primary/15 text-primary border-primary/30'
    : status === 'trial'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-destructive/15 text-destructive border-destructive/30';

export const TeacherAccountsManagement = () => {
  const { data: accounts = [], isLoading } = useAllTeacherAccounts();
  const update = useUpdateTeacherAccount();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /**
   * Solo "conectado sí/no". El admin nunca ve ni gestiona la cuenta de Stripe
   * del maestro: sus llaves, su identificador y sus cobros son suyos.
   */
  const { data: payments = [] } = useQuery({
    queryKey: ['admin-studio-payments'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_studio_payment_status');
      if (error) throw error;
      return (data ?? []) as Array<{ account_id: string; connected: boolean; charges_enabled: boolean }>;
    },
  });
  const paymentMap = useMemo(
    () => new Map(payments.map((p) => [p.account_id, p])),
    [payments],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchesQuery =
        !q ||
        a.studio_name?.toLowerCase().includes(q) ||
        a.contact_email?.toLowerCase().includes(q) ||
        a.invite_code?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [accounts, search, statusFilter]);

  const totals = useMemo(() => {
    const active = accounts.filter((a) => a.status === 'active');
    const mrr = active.reduce(
      (sum, a) => sum + (TEACHER_PLAN_MAP[(a.plan as TeacherPlanId) ?? 'starter']?.price ?? 0),
      0,
    );
    return {
      total: accounts.length,
      active: active.length,
      trial: accounts.filter((a) => a.status === 'trial').length,
      students: accounts.reduce((sum, a) => sum + (a.seats_used ?? 0), 0),
      mrr,
    };
  }, [accounts]);

  const setPlan = (id: string, plan: TeacherPlanId) =>
    update.mutate(
      { id, plan, seat_limit: TEACHER_PLAN_MAP[plan].seats },
      {
        onSuccess: () => toast.success(`Plan actualizado a ${TEACHER_PLAN_MAP[plan].label}`),
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'No se pudo actualizar'),
      },
    );

  const setStatus = (id: string, status: (typeof STATUSES)[number]) =>
    update.mutate(
      { id, status },
      {
        onSuccess: () => toast.success('Estado actualizado'),
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'No se pudo actualizar'),
      },
    );

  return (
    <div className="space-y-5">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Maestros', value: totals.total, icon: GraduationCap },
          { label: 'Activos / prueba', value: `${totals.active} / ${totals.trial}`, icon: Users },
          { label: 'Alumnos en estudios', value: totals.students, icon: Users },
          { label: 'MRR estimado', value: `$${totals.mrr}`, icon: Wallet },
        ].map((m) => (
          <Card key={m.label} className="p-4 bg-card/70 border-white/10">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <m.icon className="w-4 h-4" />
              {m.label}
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por estudio, email o código"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TEACHER_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground bg-card/70 border-white/10">
          Cargando maestros…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center bg-card/70 border-white/10">
          <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-semibold">Aún no hay estudios de maestros</p>
          <p className="text-sm text-muted-foreground">
            Comparte la página de planes para maestros y aquí verás cada cuenta.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const plan = TEACHER_PLAN_MAP[(a.plan as TeacherPlanId) ?? 'starter'];
            const used = a.seats_used ?? 0;
            const pct = Math.min(100, Math.round((used / (a.seat_limit || 1)) * 100));
            return (
              <Card key={a.id} className="p-4 bg-card/70 border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{a.studio_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.contact_email ?? 'Sin email'} · {a.primary_instrument ?? 'sin instrumento'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={statusVariant(a.status)}>
                      {TEACHER_STATUS_LABEL[a.status] ?? a.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {paymentMap.get(a.id)?.charges_enabled
                        ? 'Stripe conectado'
                        : paymentMap.get(a.id)?.connected
                          ? 'Stripe pendiente'
                          : 'Stripe sin conectar'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      Alumnos: {used} / {a.seat_limit}
                    </span>
                    <span>{plan?.label} · ${plan?.price}/mes</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={a.plan ?? 'starter'} onValueChange={(v) => setPlan(a.id, v as TeacherPlanId)}>
                    <SelectTrigger className="w-40 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEACHER_PLANS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label} · {p.seats} alumnos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={a.status} onValueChange={(v) => setStatus(a.id, v as (typeof STATUSES)[number])}>
                    <SelectTrigger className="w-36 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {TEACHER_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {a.invite_code && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(studioInviteUrl(a.invite_code!));
                        toast.success('Enlace de invitación copiado');
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar invitación
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
