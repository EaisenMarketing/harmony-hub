import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Check, Loader2, Music, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  MEMBERSHIP_PLANS, MEMBERSHIP_PLAN_MAP, PLAN_LABEL, LEVEL_LABEL, formatMoney, trialEndCopy,
  isMembershipPlan, PRIVATE_LESSON_OPTIONS, INSTRUMENT_CHANGE_COOLDOWN_DAYS, type PlanKeyNew,
} from '@/lib/membership';
import {
  useEntitlement, useChangePlan, useCancelMembership, useInstrumentsCatalog,
  useSetActiveInstrument, useBuyPrivateLesson, useMyPrivateLessons, useMyPaymentMethods,
} from '@/hooks/useMembership';
import type { InstrumentSlug } from '@/lib/instrument-access';

const STATUS_LABEL: Record<string, string> = {
  trialing: 'En prueba gratuita',
  active: 'Activa',
  inactive: 'Sin membresía',
};

export const MembershipSection = () => {
  const { data: ent, isLoading } = useEntitlement();
  const { data: instruments } = useInstrumentsCatalog();
  const { data: methods } = useMyPaymentMethods();
  const { data: privateLessons } = useMyPrivateLessons();
  const changePlan = useChangePlan();
  const cancel = useCancelMembership();
  const setInstrument = useSetActiveInstrument();
  const buyPrivate = useBuyPrivateLesson();

  const [planTarget, setPlanTarget] = useState<PlanKeyNew | null>(null);
  const [instrumentTarget, setInstrumentTarget] = useState<InstrumentSlug | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading || !ent) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const plan = isMembershipPlan(ent.plan_key) ? MEMBERSHIP_PLAN_MAP[ent.plan_key] : null;
  const currentInstrumentName =
    (instruments ?? []).find((i) => i.slug === ent.instrument_slug)?.name ?? 'Sin instrumento';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Membresía</h1>
        <p className="text-muted-foreground mt-1">Tu plan, tu instrumento y tus pagos.</p>
      </div>

      {/* Estado actual */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Plan</p>
            <h2 className="text-2xl font-bold text-foreground">{PLAN_LABEL(ent.plan_key)}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={ent.status === 'inactive' ? 'secondary' : 'default'}>
                {STATUS_LABEL[ent.status]}
              </Badge>
              {plan && <span className="text-sm text-muted-foreground">{formatMoney(plan.priceUsd)}/mes</span>}
            </div>
            {ent.status === 'trialing' && isMembershipPlan(ent.plan_key) && (
              <p className="text-sm text-muted-foreground mt-3">
                Te quedan {ent.trial_days_left ?? 0} {ent.trial_days_left === 1 ? 'día' : 'días'} de prueba.
                <br />{trialEndCopy(ent.plan_key, ent.trial_ends_at)}
              </p>
            )}
            {ent.status === 'active' && ent.current_period_end && (
              <p className="text-sm text-muted-foreground mt-3">
                Próximo cobro: {new Date(ent.current_period_end).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tu instrumento</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{currentInstrumentName}</p>
                <p className="text-xs text-muted-foreground">Nivel: {LEVEL_LABEL(ent.level_key)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Todos los planes incluyen 1 instrumento. Puedes cambiarlo 1 vez cada {INSTRUMENT_CHANGE_COOLDOWN_DAYS} días.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Planes */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Planes disponibles</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {MEMBERSHIP_PLANS.map((p) => {
            const isCurrent = ent.plan_key === p.key;
            return (
              <Card key={p.key} className={cn('relative flex flex-col', isCurrent && 'ring-2 ring-primary')}>
                {p.popular && (
                  <Badge className="absolute -top-3 left-4">MÁS POPULAR</Badge>
                )}
                <CardHeader className="pb-3">
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>{p.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-4xl font-black text-foreground mb-4">
                    ${p.priceUsd}<span className="text-sm font-normal text-muted-foreground">/mes</span>
                  </p>
                  <ul className="space-y-2 mb-5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? 'secondary' : 'default'}
                    disabled={isCurrent}
                    onClick={() => setPlanTarget(p.key)}
                  >
                    {isCurrent ? 'Plan actual' : 'Cambiar a este plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Cambiar de plan no cambia tu instrumento: conservas {currentInstrumentName} y todo tu progreso.
        </p>
      </div>

      {/* Cambio de instrumento */}
      <Card>
        <CardHeader>
          <CardTitle>Cambiar de instrumento</CardTitle>
          <CardDescription>Solo puedes tener un instrumento activo a la vez.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(instruments ?? []).map((i) => (
              <button
                key={i.slug}
                type="button"
                onClick={() => i.slug !== ent.instrument_slug && setInstrumentTarget(i.slug)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-1 rounded-xl border px-4 py-3 min-w-[92px] transition-all',
                  i.slug === ent.instrument_slug
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                    : 'border-border bg-muted hover:border-primary/50',
                )}
              >
                <span className="text-2xl">{i.emoji ?? '🎵'}</span>
                <span className="text-[11px] font-medium text-foreground text-center leading-tight">{i.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clases privadas */}
      <Card>
        <CardHeader>
          <CardTitle>Clases privadas (complemento)</CardTitle>
          <CardDescription>No están incluidas en los planes. Se compran aparte y aplican a tu instrumento activo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {PRIVATE_LESSON_OPTIONS.map((o) => (
            <div key={o.type} className="rounded-xl border border-border p-4">
              <p className="font-semibold text-foreground">{o.label}</p>
              <p className="text-2xl font-black text-foreground mt-1">${o.priceUsd} <span className="text-xs font-normal text-muted-foreground">USD</span></p>
              <p className="text-xs text-muted-foreground mb-3">{o.duration}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={!ent.instrument_slug || buyPrivate.isPending}
                onClick={() => ent.instrument_slug && buyPrivate.mutate({
                  instrument: ent.instrument_slug, type: o.type, sessions: o.sessions, amountUsd: o.priceUsd,
                })}
              >
                Solicitar
              </Button>
            </div>
          ))}
          {(privateLessons ?? []).length > 0 && (
            <div className="sm:col-span-2 text-xs text-muted-foreground">
              Tienes {privateLessons!.length} solicitud(es) de clase privada registradas.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pago y cancelación */}
      <Card>
        <CardHeader>
          <CardTitle>Método de pago y cancelación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CreditCard className="w-5 h-5" />
            {(methods ?? []).length
              ? `Tarjeta registrada terminada en ${methods![0].last4 ?? '••••'}`
              : 'Aún no registras un método de pago.'}
            {!(methods ?? []).length && (
              <Button size="sm" variant="outline" asChild><Link to="/empezar">Agregar</Link></Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild><Link to="/portal/progreso"><CalendarClock className="w-4 h-4 mr-2" />Ver mi progreso</Link></Button>
            <Button variant="destructive" onClick={() => setCancelOpen(true)} disabled={ent.status === 'inactive'}>
              Cancelar membresía
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmar cambio de plan */}
      <Dialog open={!!planTarget} onOpenChange={(o) => !o && setPlanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar a {planTarget ? MEMBERSHIP_PLAN_MAP[planTarget].name : ''}</DialogTitle>
            <DialogDescription>
              Conservas tu instrumento ({currentInstrumentName}) y tu progreso. Solo cambian los beneficios del plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanTarget(null)}>Cancelar</Button>
            <Button
              onClick={() => { if (planTarget) changePlan.mutate(planTarget); setPlanTarget(null); }}
            >
              Confirmar cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar cambio de instrumento */}
      <Dialog open={!!instrumentTarget} onOpenChange={(o) => !o && setInstrumentTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar de instrumento</DialogTitle>
            <DialogDescription>
              Actualmente estudias {currentInstrumentName}. Si cambias a{' '}
              {(instruments ?? []).find((i) => i.slug === instrumentTarget)?.name}, perderás temporalmente el acceso a{' '}
              {currentInstrumentName}. Tu progreso será guardado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstrumentTarget(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (instrumentTarget) setInstrument.mutate({ instrument: instrumentTarget });
                setInstrumentTarget(null);
              }}
            >
              Confirmar cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancelar */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar membresía</DialogTitle>
            <DialogDescription>
              {ent.status === 'trialing'
                ? 'Cancelarás durante tu prueba gratuita, así que no se realizará ningún cobro.'
                : 'Mantendrás el acceso hasta el final del periodo ya pagado. Tu progreso, tu cuenta y tu instrumento no se eliminan.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Volver</Button>
            <Button variant="destructive" onClick={() => { cancel.mutate(); setCancelOpen(false); }}>
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
