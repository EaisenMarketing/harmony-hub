import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';
import { TEACHER_PLANS, TEACHER_PLAN_MAP, studioInviteUrl } from '@/lib/teacher-plans';
import { useUpdateTeacherAccount, type TeacherAccount } from '@/hooks/useTeacherStudio';

export const StudioSettings = ({ account }: { account: TeacherAccount }) => {
  const update = useUpdateTeacherAccount();
  const [form, setForm] = useState({
    studio_name: account.studio_name,
    primary_instrument: account.primary_instrument ?? '',
    contact_email: account.contact_email ?? '',
    phone: account.phone ?? '',
    bio: account.bio ?? '',
  });

  const inviteUrl = studioInviteUrl(account.invite_code);

  const save = async () => {
    try {
      await update.mutateAsync({ id: account.id, ...form, primary_instrument: form.primary_instrument || null });
      toast({ title: 'Datos guardados' });
    } catch (e) {
      toast({ title: 'No se pudo guardar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const changePlan = async (plan: 'starter' | 'pro' | 'academy') => {
    try {
      await update.mutateAsync({ id: account.id, plan, seat_limit: TEACHER_PLAN_MAP[plan].seats });
      toast({ title: `Plan ${TEACHER_PLAN_MAP[plan].label} seleccionado`, description: 'El cobro se activará cuando habilitemos pagos.' });
    } catch (e) {
      toast({ title: 'No se pudo cambiar el plan', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Configuración del estudio</h2>

      <Card className="p-4 bg-card/70 border-white/10 space-y-3">
        <div className="space-y-1.5">
          <Label>Nombre del estudio</Label>
          <Input value={form.studio_name} onChange={(e) => setForm({ ...form, studio_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Instrumento principal</Label>
          <select
            className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
            value={form.primary_instrument}
            onChange={(e) => setForm({ ...form, primary_instrument: e.target.value })}
          >
            <option value="">Sin definir</option>
            {INSTRUMENT_PLANS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Email de contacto</Label>
            <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Presentación</Label>
          <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <Button onClick={save} disabled={update.isPending}>
          Guardar cambios
        </Button>
      </Card>

      <Card className="p-4 bg-card/70 border-white/10 space-y-2">
        <h3 className="font-semibold text-foreground text-sm">Enlace de invitación</h3>
        <p className="text-xs text-muted-foreground break-all">{inviteUrl}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(inviteUrl);
              toast({ title: 'Enlace copiado' });
            } catch {
              toast({ title: 'Copia manualmente', description: inviteUrl });
            }
          }}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copiar
        </Button>
      </Card>

      <Card className="p-4 bg-card/70 border-white/10 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Plan de suscripción</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {TEACHER_PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => changePlan(p.id)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                account.plan === p.id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{p.label}</p>
              <p className="text-xs text-muted-foreground">
                ${p.price}/mes · {p.seats} alumnos
              </p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
