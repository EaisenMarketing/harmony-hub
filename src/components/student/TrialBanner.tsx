import { AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEntitlement } from '@/hooks/useMembership';
import { trialEndCopy, isMembershipPlan } from '@/lib/membership';

/** Banner de estado de prueba: días restantes y fecha/monto del primer cobro. */
export const TrialBanner = () => {
  const { data: ent } = useEntitlement();
  if (!ent || ent.is_admin) return null;

  if (ent.status === 'trialing' && isMembershipPlan(ent.plan_key)) {
    const days = ent.trial_days_left ?? 0;
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Clock className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Te quedan {days} {days === 1 ? 'día' : 'días'} de prueba gratis.
            </p>
            <p className="text-xs text-muted-foreground">{trialEndCopy(ent.plan_key, ent.trial_ends_at)}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/portal/pagos">Ver mi membresía</Link>
        </Button>
      </div>
    );
  }

  if (ent.status === 'inactive') {
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">No tienes una membresía activa</p>
            <p className="text-xs text-muted-foreground">Activa tu prueba gratis de 3 días o elige un plan para desbloquear tu contenido.</p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link to="/empezar">Empezar</Link>
        </Button>
      </div>
    );
  }

  return null;
};
