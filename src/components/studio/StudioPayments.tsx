import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CreditCard, ShieldCheck, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import type { TeacherAccount } from '@/hooks/useTeacherStudio';

interface StudioPaymentStatus {
  status: string;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  monthly_price: number | null;
  default_currency: string | null;
}

const useStudioPaymentStatus = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-payments', accountId],
    enabled: !!accountId,
    queryFn: async (): Promise<StudioPaymentStatus | null> => {
      const { data, error } = await supabase.rpc('studio_payment_status', { _account_id: accountId! });
      if (error) throw error;
      return (data as StudioPaymentStatus[] | null)?.[0] ?? null;
    },
  });

const stateLabel = (status?: string | null, charges?: boolean) => {
  if (!status || status === 'not_connected') return { text: 'No conectado', variant: 'outline' as const };
  if (status === 'connected' && charges) return { text: 'Conectado', variant: 'secondary' as const };
  return { text: 'Pendiente de verificación', variant: 'outline' as const };
};

export const StudioPayments = ({ account }: { account: TeacherAccount }) => {
  const qc = useQueryClient();
  const { data: status, isLoading } = useStudioPaymentStatus(account.id);
  const [form, setForm] = useState({ monthly_price: '', currency: 'USD' });

  useEffect(() => {
    if (!status) return;
    setForm({
      monthly_price: status.monthly_price != null ? String(status.monthly_price) : '',
      currency: status.default_currency ?? 'USD',
    });
  }, [status]);

  const connect = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('studio-stripe-onboard');
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error('No se recibió el enlace de Stripe');
      window.location.href = url;
    },
    onError: (e) =>
      toast({
        title: 'No se pudo abrir Stripe',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      }),
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('studio-stripe-status');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-payments'] });
      toast({ title: 'Estado actualizado' });
    },
    onError: (e) =>
      toast({
        title: 'No se pudo actualizar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      }),
  });

  const savePricing = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('save_studio_pricing', {
        _account_id: account.id,
        _monthly_price: form.monthly_price ? Number(form.monthly_price) : null,
        _currency: form.currency || 'USD',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-payments'] });
      toast({ title: 'Precio guardado', description: 'Es lo que se le cobrará a cada alumno tuyo.' });
    },
    onError: (e) =>
      toast({
        title: 'No se pudo guardar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      }),
  });

  const label = stateLabel(status?.status, status?.charges_enabled);
  const connected = status?.status === 'connected' && status.charges_enabled;
  const pending = !!status?.stripe_account_id && !connected;

  return (
    <Card className="p-4 bg-card/70 border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Pagos de tus alumnos (tu Stripe)</h3>
        </div>
        {!isLoading && <Badge variant={label.variant}>{label.text}</Badge>}
      </div>

      <p className="text-xs text-muted-foreground">
        Conecta tu propia cuenta de Stripe. Todo lo que cobres a{' '}
        <span className="text-foreground">tus alumnos</span> llega directo a tu cuenta bancaria; Acorde Live no
        participa ni toma comisión. Tu pago con nosotros es únicamente la mensualidad del software.
      </p>

      <div className="p-3 rounded-xl border border-white/10 bg-background/50 space-y-2 text-xs text-muted-foreground">
        <p className="text-foreground font-semibold">Cómo funciona</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Toca “Conectar con Stripe”. Se abre el registro seguro de Stripe (Express).</li>
          <li>Stripe te pide tus datos fiscales y tu cuenta bancaria para depositarte. Toma unos minutos.</li>
          <li>Al terminar regresas aquí y el estado cambia a “Conectado”.</li>
          <li>Define el precio mensual que le cobras a cada alumno y guarda.</li>
        </ol>
        <p className="flex items-start gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          Nunca guardamos ni te pedimos tus llaves secretas de Stripe. Tu identidad y verificación las maneja Stripe
          directamente.
        </p>
      </div>

      {status?.stripe_account_id && (
        <div className="p-3 rounded-xl border border-white/10 bg-background/40 text-xs space-y-1">
          <p className="text-muted-foreground">
            Cuenta conectada: <span className="text-foreground font-mono">{status.stripe_account_id}</span>
          </p>
          <p className="text-muted-foreground">
            Cobros: <span className="text-foreground">{status.charges_enabled ? 'habilitados' : 'pendientes'}</span> ·
            Depósitos: <span className="text-foreground">{status.payouts_enabled ? 'habilitados' : 'pendientes'}</span>
          </p>
        </div>
      )}

      {pending && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          Stripe todavía está verificando tu cuenta. Puedes continuar el registro o actualizar el estado.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
          <ExternalLink className="w-3.5 h-3.5 mr-2" />
          {connected ? 'Abrir panel de Stripe' : pending ? 'Continuar verificación' : 'Conectar con Stripe'}
        </Button>
        {status?.stripe_account_id && (
          <Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Actualizar estado
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/10">
        <div className="space-y-1.5">
          <Label>Precio mensual a tus alumnos</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="49.99"
            value={form.monthly_price}
            onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Moneda</Label>
          <select
            className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            <option value="USD">USD</option>
            <option value="MXN">MXN</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <Button variant="secondary" onClick={() => savePricing.mutate()} disabled={savePricing.isPending}>
        Guardar precio
      </Button>
    </Card>
  );
};
