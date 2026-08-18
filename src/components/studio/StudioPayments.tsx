import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CreditCard, ShieldCheck, ExternalLink, Unplug } from 'lucide-react';
import type { TeacherAccount } from '@/hooks/useTeacherStudio';

interface StripeStatus {
  connected: boolean;
  publishable_key: string | null;
  monthly_price: number | null;
  currency: string | null;
  payment_link_url: string | null;
  connected_at: string | null;
}

const useStripeStatus = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-stripe', accountId],
    enabled: !!accountId,
    queryFn: async (): Promise<StripeStatus | null> => {
      const { data, error } = await supabase.rpc('teacher_stripe_status', { _account_id: accountId! });
      if (error) throw error;
      return (data as StripeStatus[] | null)?.[0] ?? null;
    },
  });

export const StudioPayments = ({ account }: { account: TeacherAccount }) => {
  const qc = useQueryClient();
  const { data: status, isLoading } = useStripeStatus(account.id);
  const [form, setForm] = useState({
    publishable_key: '',
    secret_key: '',
    monthly_price: '',
    currency: 'USD',
    payment_link_url: '',
  });

  useEffect(() => {
    if (!status) return;
    setForm((f) => ({
      ...f,
      publishable_key: status.publishable_key ?? '',
      monthly_price: status.monthly_price != null ? String(status.monthly_price) : '',
      currency: status.currency ?? 'USD',
      payment_link_url: status.payment_link_url ?? '',
    }));
  }, [status]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('save_teacher_stripe_settings', {
        _account_id: account.id,
        _publishable_key: form.publishable_key || null,
        _secret_key: form.secret_key || null,
        _monthly_price: form.monthly_price ? Number(form.monthly_price) : null,
        _currency: form.currency || 'USD',
        _payment_link_url: form.payment_link_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm((f) => ({ ...f, secret_key: '' }));
      qc.invalidateQueries({ queryKey: ['studio-stripe'] });
      toast({ title: 'Cuenta de cobros guardada', description: 'Tus alumnos te pagarán directo a tu Stripe.' });
    },
    onError: (e) =>
      toast({
        title: 'No se pudo guardar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      }),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('disconnect_teacher_stripe', { _account_id: account.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm((f) => ({ ...f, publishable_key: '', secret_key: '' }));
      qc.invalidateQueries({ queryKey: ['studio-stripe'] });
      toast({ title: 'Stripe desconectado' });
    },
  });

  return (
    <Card className="p-4 bg-card/70 border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Conectar cuenta de Stripe (tus cobros)</h3>
        </div>
        {!isLoading && (
          <Badge variant={status?.connected ? 'secondary' : 'outline'}>
            {status?.connected ? 'Conectada' : 'Sin conectar'}
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Tú decides cuánto cobras a tus alumnos y el dinero llega <span className="text-foreground">directo a tu
        cuenta de Stripe</span>. Acorde Live no participa en ese cobro ni toma comisión: tu pago con nosotros es
        únicamente la mensualidad del software.
      </p>

      <div className="p-3 rounded-xl border border-white/10 bg-background/50 space-y-2 text-xs text-muted-foreground">
        <p className="text-foreground font-semibold">Cómo conectar tu cuenta (5 minutos)</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>
            Crea tu cuenta gratis en{' '}
            <a
              href="https://dashboard.stripe.com/register"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              stripe.com <ExternalLink className="w-3 h-3" />
            </a>{' '}
            y completa tus datos bancarios (así recibes tus depósitos).
          </li>
          <li>
            En Stripe entra a <span className="text-foreground">Developers → API keys</span> y copia tu{' '}
            <span className="text-foreground">Publishable key</span> (empieza con <code>pk_live_</code>) y tu{' '}
            <span className="text-foreground">Secret key</span> (empieza con <code>sk_live_</code>).
          </li>
          <li>Pega ambas llaves aquí abajo y escribe el precio mensual que le vas a cobrar a cada alumno.</li>
          <li>
            Opcional pero recomendado: en Stripe crea un{' '}
            <span className="text-foreground">Payment Link</span> de suscripción mensual (Products → crea tu plan →
            Payment link) y pega el enlace aquí. Ese enlace es el que compartes con tus alumnos para que se
            suscriban contigo.
          </li>
          <li>Guarda. Verás el estado como “Conectada”.</li>
        </ol>
        <p className="flex items-start gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          Tu llave secreta se guarda cifrada del lado del servidor y nunca se vuelve a mostrar en pantalla. Si crees
          que se filtró, gíralas en Stripe y vuelve a pegarlas aquí.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Publishable key</Label>
          <Input
            placeholder="pk_live_..."
            value={form.publishable_key}
            onChange={(e) => setForm({ ...form, publishable_key: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Secret key</Label>
          <Input
            type="password"
            autoComplete="off"
            placeholder={status?.connected ? '•••••••• (ya guardada)' : 'sk_live_...'}
            value={form.secret_key}
            onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
          />
        </div>
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

      <div className="space-y-1.5">
        <Label>Enlace de pago de Stripe (opcional)</Label>
        <Input
          placeholder="https://buy.stripe.com/..."
          value={form.payment_link_url}
          onChange={(e) => setForm({ ...form, payment_link_url: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">
          Este enlace lo compartes con tus prospectos y alumnos para que se suscriban contigo.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {status?.connected ? 'Guardar cambios' : 'Conectar cuenta de Stripe'}
        </Button>
        {status?.connected && (
          <Button variant="outline" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
            <Unplug className="w-3.5 h-3.5 mr-2" />
            Desconectar
          </Button>
        )}
      </div>
    </Card>
  );
};
