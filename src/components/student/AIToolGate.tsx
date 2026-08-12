import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import { useEntitlement, useAiToolsCatalog } from '@/hooks/useMembership';
import { MEMBERSHIP_PLANS, PLAN_LABEL, formatMoney, isMembershipPlan, TRIAL_AI_TOOL } from '@/lib/membership';
import { INSTRUMENT_PLAN_MAP, type InstrumentSlug } from '@/lib/instrument-access';

interface Props {
  /** Key in the `ai_tools` catalog (e.g. 'chord_generator'). */
  toolKey: string;
  toolName: string;
  /** Fallback list of instruments if the catalog has none configured. */
  allowedInstruments?: InstrumentSlug[] | null;
  children: React.ReactNode;
  buttonLabel: string;
  icon?: React.ReactNode;
  variant?: 'outline' | 'secondary' | 'default';
}

/**
 * Gates an AI tool by INSTRUMENT (which instruments the tool applies to)
 * and by PLAN (which plans include the tool: Esencial 1, Pro 3, Premium todas).
 */
export const AIToolGate = ({
  toolKey,
  toolName,
  allowedInstruments,
  children,
  buttonLabel,
  icon,
  variant = 'outline',
}: Props) => {
  const navigate = useNavigate();
  const { data: ent } = useEntitlement();
  const { data: catalog } = useAiToolsCatalog();
  const [open, setOpen] = useState(false);

  const instrument = (ent?.instrument_slug ?? null) as InstrumentSlug | null;

  const catalogInstruments = useMemo<InstrumentSlug[]>(() => {
    const tool = catalog?.tools?.find((t) => t.key === toolKey);
    const list = (tool?.instrument_slugs ?? []) as InstrumentSlug[];
    if (list.length) return list;
    return allowedInstruments ?? [];
  }, [catalog, toolKey, allowedInstruments]);

  const instrumentOk = catalogInstruments.length === 0
    ? !!instrument
    : !!instrument && catalogInstruments.includes(instrument);

  const planOk = useMemo(() => {
    if (!ent) return false;
    if (ent.status === 'inactive') return false;
    if (ent.status === 'trialing') return toolKey === TRIAL_AI_TOOL;
    if (!ent.plan_key) return false;
    return !!catalog?.perms?.some(
      (p) => p.plan_key === ent.plan_key && p.ai_tool_key === toolKey && p.enabled,
    );
  }, [ent, catalog, toolKey]);

  if (ent?.is_admin) return <>{children}</>;
  if (instrumentOk && planOk) return <>{children}</>;

  const currentLabel = instrument ? INSTRUMENT_PLAN_MAP[instrument]?.label : 'ninguno';
  const allowedLabels = catalogInstruments
    .map((i) => INSTRUMENT_PLAN_MAP[i]?.label)
    .filter(Boolean)
    .join(', ');

  // Plan más económico que incluye la herramienta.
  const upgradePlan = MEMBERSHIP_PLANS.find((p) =>
    catalog?.perms?.some((x) => x.plan_key === p.key && x.ai_tool_key === toolKey && x.enabled),
  );

  const reason = !instrumentOk
    ? instrument
      ? `Tu instrumento activo es ${currentLabel} y esta herramienta está disponible para: ${allowedLabels || 'otro instrumento'}.`
      : 'Necesitas elegir un instrumento antes de usar esta herramienta.'
    : ent?.status === 'inactive'
      ? 'Necesitas una membresía activa (o tu prueba gratis de 3 días) para usar las herramientas de Acorde AI.'
      : ent?.status === 'trialing'
        ? 'Durante la prueba gratuita solo está incluido el Asistente de Teoría Musical. Tu plan se activará al terminar la prueba.'
        : `Tu plan ${PLAN_LABEL(ent?.plan_key)} no incluye esta herramienta.${
            upgradePlan ? ` Está incluida desde el plan ${upgradePlan.name} (${formatMoney(upgradePlan.priceUsd)}/mes).` : ''
          }`;

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)} className="gap-2 opacity-90">
        <Lock className="w-4 h-4" />
        {buttonLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-2">
              {icon ?? <Lock className="w-6 h-6 text-muted-foreground" />}
            </div>
            <DialogTitle>{toolName} bloqueado</DialogTitle>
            <DialogDescription>{reason}</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {isMembershipPlan(ent?.plan_key)
              ? 'Puedes cambiar tu plan o tu instrumento desde “Mi Membresía”.'
              : 'Activa tu prueba gratis de 3 días o elige un plan para desbloquear las herramientas.'}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); navigate('/portal/pagos'); }}>
              Mi membresía
            </Button>
            <Button onClick={() => { setOpen(false); navigate(isMembershipPlan(ent?.plan_key) ? '/precios' : '/empezar'); }}>
              {isMembershipPlan(ent?.plan_key) ? 'Ver planes' : 'Empezar prueba'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
