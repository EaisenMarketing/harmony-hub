import { useState } from 'react';
import { CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStudentProfile } from '@/hooks/useStudentData';
import { useSetUserInstrument } from '@/hooks/useUserInstrument';
import { savePendingCheckout, buildCheckoutIntent } from '@/lib/checkout';
import { INSTRUMENT_PLANS, isValidInstrument, type InstrumentSlug } from '@/lib/instrument-access';
import { CheckoutSummaryDialog } from '@/components/student/CheckoutSummaryDialog';

const sharedFeatures = [
  'Acceso completo a los cursos del instrumento',
  '1 clase grupal en vivo por semana',
  'Herramientas de IA específicas del instrumento',
  'Comunidad, feedback del maestro y certificado',
];

const productionExtras = [
  'Cursos de DAW, mezcla y mastering',
  'Clases en vivo de producción musical',
  'Biblioteca de samples y presets',
  'Tareas y material descargable',
];

const instrumentOptions = INSTRUMENT_PLANS.filter((p) => p.id !== 'production');
const productionPlan = INSTRUMENT_PLANS.find((p) => p.id === 'production')!;

export const PaymentsSection = () => {
  const { data: profile } = useStudentProfile();
  const setInstrument = useSetUserInstrument();
  const currentPlan: string = profile?.subscription_plan || 'basic';
  const currentInstrument = profile?.primary_instrument || 'piano';
  const [selected, setSelected] = useState<InstrumentSlug>(
    isValidInstrument(currentInstrument) ? currentInstrument : instrumentOptions[0].id
  );

  const currentInstrumentPlan = instrumentOptions.find((p) => p.id === selected)!;
  const isCurrentInstrument = isValidInstrument(currentPlan) && currentPlan === selected;
  const isProduction = currentPlan === 'production';

  const [confirmTarget, setConfirmTarget] = useState<InstrumentSlug | null>(null);

  // Sync the chosen instrument with the checkout that will be billed.
  const confirmCheckout = (target: InstrumentSlug) => {
    savePendingCheckout(target);
    if (isValidInstrument(currentInstrument) && currentInstrument !== target) {
      setInstrument.mutate(target);
    }
  };

  const intentPreview = buildCheckoutIntent(selected);

  const planLabel =
    currentPlan === 'production'
      ? 'Producción Musical'
      : currentPlan === 'basic'
      ? 'Básico'
      : INSTRUMENT_PLANS.find((p) => p.id === currentPlan)?.label || currentPlan;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pagos y Suscripción</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu plan y métodos de pago
        </p>
      </div>

      {/* Current Plan */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tu plan actual</p>
              <h2 className="text-2xl font-bold text-foreground capitalize">{planLabel}</h2>
              {currentPlan !== 'basic' && profile?.subscription_expires_at && (
                <p className="text-sm text-muted-foreground mt-1">
                  Válido hasta: {new Date(profile.subscription_expires_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Planes Disponibles</h2>
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] items-stretch">
          {/* $75 instrument plan */}
          <Card
            className={cn(
              'relative flex flex-col',
              isCurrentInstrument && 'ring-2 ring-primary'
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentInstrumentPlan.color} flex items-center justify-center text-3xl`}
                >
                  {currentInstrumentPlan.emoji}
                </div>
                <div>
                  <CardTitle>{currentInstrumentPlan.label}</CardTitle>
                  <CardDescription>{currentInstrumentPlan.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-5xl font-black text-foreground">$75</span>
                <span className="text-muted-foreground">/mes</span>
              </div>

              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Elige tu instrumento
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory mb-5">
                {instrumentOptions.map((p) => {
                  const isSel = p.id === selected;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={cn(
                        'snap-start flex-shrink-0 flex flex-col items-center gap-1 rounded-xl border px-3 py-2 min-w-[80px] transition-all',
                        isSel
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                          : 'border-border bg-muted hover:border-primary/50',
                      )}
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {sharedFeatures.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Se facturará: <span className="font-semibold text-foreground">{intentPreview.label}</span> · ${intentPreview.priceUsd} USD/mes
              </div>

              <Button
                className="w-full"
                variant={isCurrentInstrument ? 'secondary' : 'default'}
                disabled={isCurrentInstrument}
                onClick={() => setConfirmTarget(currentInstrumentPlan.id)}
              >
                {isCurrentInstrument ? 'Plan Actual' : 'Revisar y cambiar a este instrumento'}
              </Button>
            </CardContent>
          </Card>

          {/* Production plan */}
          <Card
            className={cn(
              'relative flex flex-col border-violet-500/60 bg-violet-500/5 shadow-[0_0_60px_-20px_hsl(280_80%_60%/0.3)]',
              isProduction && 'ring-2 ring-violet-400'
            )}
          >
            <Badge className="absolute -top-3 left-4 bg-violet-600 hover:bg-violet-600">
              Especializado
            </Badge>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${productionPlan.color} flex items-center justify-center text-3xl`}
                >
                  {productionPlan.emoji}
                </div>
                <div>
                  <CardTitle>{productionPlan.label}</CardTitle>
                  <CardDescription>{productionPlan.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-5xl font-black text-foreground">$99</span>
                <span className="text-muted-foreground">/mes</span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {productionExtras.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 mt-0.5 text-violet-400 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to="/precios?plan=production" onClick={() => goToCheckout('production')}>
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                  disabled={isProduction}
                >
                  {isProduction ? 'Plan Actual' : 'Cambiar a Producción'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>
            Tus transacciones recientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan === 'basic' ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No tienes pagos registrados. Actualiza tu plan para acceder a más contenido.
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              El historial de pagos estará disponible próximamente.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
