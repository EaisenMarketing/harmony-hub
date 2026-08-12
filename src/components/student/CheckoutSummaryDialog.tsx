import { Link } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { INSTRUMENT_PLAN_MAP, type InstrumentSlug } from '@/lib/instrument-access';
import { buildCheckoutIntent, savePendingCheckout } from '@/lib/checkout';
import { useEntitlement } from '@/hooks/useMembership';
import { MEMBERSHIP_PLAN_MAP, formatMoney, isMembershipPlan } from '@/lib/membership';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrument: InstrumentSlug;
  /** Where to send the user after they confirm. */
  continueHref: string;
  /** Called right before navigating (e.g. to persist instrument on profile). */
  onConfirm?: () => void;
}

export const CheckoutSummaryDialog = ({
  open,
  onOpenChange,
  instrument,
  continueHref,
  onConfirm,
}: Props) => {
  const info = INSTRUMENT_PLAN_MAP[instrument];
  const intent = buildCheckoutIntent(instrument);
  const { data: ent } = useEntitlement();
  const plan = isMembershipPlan(ent?.plan_key) ? MEMBERSHIP_PLAN_MAP[ent.plan_key] : null;
  const planPrice = plan ? `${formatMoney(plan.priceUsd)}/mes` : null;

  const handleConfirm = () => {
    savePendingCheckout(instrument);
    onConfirm?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirma tu suscripción</DialogTitle>
          <DialogDescription>
            $0 hoy. Revisa tu instrumento y tu plan antes de continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl`}
            >
              {info.emoji}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{info.label}</p>
              <p className="text-xs text-muted-foreground">{info.description}</p>
            </div>
            <Badge variant="secondary">Mensual</Badge>
          </div>

          <dl className="space-y-2 text-sm border-t border-border/60 pt-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium text-foreground">{plan?.name ?? 'Prueba gratis de 3 días'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Instrumento</dt>
              <dd className="font-medium text-foreground capitalize">{info.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Facturación</dt>
              <dd className="font-medium text-foreground">Cada mes · cancela cuando quieras</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Membresía</dt>
              <dd className="font-medium text-foreground">
                {planPrice ? `${planPrice} después de la prueba` : 'Según el plan que elijas'}
              </dd>
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-border/60">
              <dt className="font-semibold text-foreground">Total hoy</dt>
              <dd className="font-bold text-foreground">$0.00 USD</dd>
            </div>
          </dl>
        </div>

        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" /> Acceso inmediato al contenido del instrumento</li>
          <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" /> Clases en vivo, comunidad y certificado</li>
          <li className="flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" /> Puedes cambiar de instrumento o cancelar en cualquier momento</li>
        </ul>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Link to={continueHref} onClick={handleConfirm} className="sm:ml-auto">
            <Button className="w-full sm:w-auto">Continuar al pago</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
