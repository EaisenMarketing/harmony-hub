import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Link2, Users, Megaphone, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';
import { TEACHER_PLANS, TEACHER_PLAN_MAP, studioJoinUrl, studioLeadsUrl } from '@/lib/teacher-plans';
import {
  useUpdateTeacherAccount,
  useStudioStatus,
  useSetStudioSlug,
  SLUG_ERRORS,
  type TeacherAccount,
} from '@/hooks/useTeacherStudio';
import { TEACHER_STATUS_LABEL } from '@/lib/teacher-plans';
import { Badge } from '@/components/ui/badge';
import { StudioPayments } from '@/components/studio/StudioPayments';

export const StudioSettings = ({ account }: { account: TeacherAccount }) => {
  const update = useUpdateTeacherAccount();
  const { data: status } = useStudioStatus(account.id);
  const [form, setForm] = useState({
    studio_name: account.studio_name,
    primary_instrument: account.primary_instrument ?? '',
    contact_email: account.contact_email ?? '',
    phone: account.phone ?? '',
    bio: account.bio ?? '',
    avatar_url: account.avatar_url ?? '',
  });
  const setSlug = useSetStudioSlug();
  const [slug, setSlugValue] = useState(account.public_slug ?? '');

  const domain = window.location.host;
  const leadsUrl = studioLeadsUrl(account);
  const joinUrl = studioJoinUrl(account);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Enlace copiado', description: url });
    } catch {
      toast({ title: 'Copia manualmente', description: url });
    }
  };

  const saveSlug = async () => {
    try {
      const res = await setSlug.mutateAsync(slug);
      setSlugValue(res.slug ?? slug);
      toast({ title: 'Enlace actualizado', description: `${domain}/${res.slug}` });
    } catch (e) {
      const key = e instanceof Error ? e.message : '';
      toast({ title: 'No se pudo guardar', description: SLUG_ERRORS[key] ?? key, variant: 'destructive' });
    }
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        id: account.id,
        ...form,
        primary_instrument: form.primary_instrument || null,
        avatar_url: form.avatar_url || null,
      });
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
          <Label>Tu biografía / presentación</Label>
          <Textarea
            rows={4}
            placeholder="Cuéntales a tus alumnos tu experiencia, estilo de enseñanza y logros."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground">Se muestra en tu página pública y en la invitación.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Foto (URL de imagen)</Label>
          <Input
            placeholder="https://…"
            value={form.avatar_url}
            onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
          />
        </div>
        <Button onClick={save} disabled={update.isPending}>
          Guardar cambios
        </Button>
      </Card>

      <StudioEmailSettings account={account} />

      <StudioPayments account={account} />


      <Card className="p-4 bg-card/70 border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Editar dominio / enlace</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Personaliza tu enlace para compartir en redes sociales. En vez de números y códigos, puedes poner tu nombre
          personal o el nombre de tu academia (por ejemplo <span className="text-foreground">{domain}/amanda-music</span>).
          Usa solo letras, números y guiones; sin espacios ni acentos.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-1 flex-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{domain}/</span>
            <Input
              value={slug}
              placeholder="tu-nombre-o-academia"
              onChange={(e) => setSlugValue(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={saveSlug} disabled={setSlug.isPending || !slug.trim()}>
            Guardar enlace
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 rounded-xl border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Para redes sociales (prospectos)</p>
            </div>
            <p className="text-xs text-muted-foreground break-all">{leadsUrl}</p>
            <Button size="sm" variant="outline" onClick={() => copy(leadsUrl)}>
              <Copy className="w-3.5 h-3.5 mr-2" />
              Copiar
            </Button>
          </div>
          <div className="p-3 rounded-xl border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Para tus alumnos (acceso directo)</p>
            </div>
            <p className="text-xs text-muted-foreground break-all">{joinUrl}</p>
            <Button size="sm" variant="outline" onClick={() => copy(joinUrl)}>
              <Copy className="w-3.5 h-3.5 mr-2" />
              Copiar
            </Button>
          </div>
        </div>
        {!account.public_slug && (
          <p className="text-[11px] text-muted-foreground">
            Aún usas el enlace con código. Al guardar tu enlace personalizado, ambos seguirán funcionando.
          </p>
        )}
      </Card>

      <Card className="p-4 bg-card/70 border-white/10 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground text-sm">Plan de suscripción</h3>
          {status && (
            <div className="flex items-center gap-2">
              <Badge variant={status.is_active ? 'secondary' : 'destructive'}>
                {TEACHER_STATUS_LABEL[status.status] ?? status.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {status.seats_used}/{status.seat_limit} cupos
                {status.days_left !== null ? ` · ${status.days_left} día(s)` : ''}
              </span>
            </div>
          )}
        </div>
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
