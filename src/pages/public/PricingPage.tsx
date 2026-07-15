import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { INSTRUMENT_PLANS, isValidInstrument, type InstrumentSlug } from '@/lib/instrument-access';
import { savePendingCheckout } from '@/lib/checkout';
import { savePendingInstrument } from '@/lib/auth-redirect';
import { cn } from '@/lib/utils';

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

export default function PricingPage() {
  const [params] = useSearchParams();
  const courseHint = params.get('course');
  const next = courseHint ? `/cursos/${courseHint}` : '/portal';
  const planParam = params.get('plan');
  const initial: InstrumentSlug =
    isValidInstrument(planParam) && planParam !== 'production'
      ? planParam
      : instrumentOptions[0].id;
  const [selected, setSelected] = useState<InstrumentSlug>(initial);
  const current = instrumentOptions.find((p) => p.id === selected)!;

  // Keep the checkout intent in sync with the instrument the user picks here.
  useEffect(() => {
    savePendingCheckout(selected);
    savePendingInstrument(selected);
  }, [selected]);

  return (
    <PublicLayout>
      <Seo
        title="Precios y planes"
        description="Un plan por instrumento en Acorde Live. $75/mes por instrumento y $99/mes para Producción Musical. Cancela cuando quieras."
        path="/precios"
      />
      <div className="container mx-auto px-4 py-14">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Un precio, tu instrumento</h1>
          <p className="text-white/60">
            $75/mes por cualquier instrumento. Sin permanencia, cancela cuando quieras.
          </p>
        </header>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 max-w-5xl mx-auto items-stretch">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex flex-col">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center text-3xl mb-5 transition-all`}>
              {current.emoji}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{current.label}</h2>
            <p className="text-sm text-white/60 mb-5">{current.description}</p>

            <div className="mb-6">
              <span className="text-5xl font-black text-white">$75</span>
              <span className="text-white/50 text-base"> USD / mes</span>
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-white/50 mb-3">
                Elige tu instrumento
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {instrumentOptions.map((p) => {
                  const isSel = p.id === selected;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={cn(
                        'snap-start flex-shrink-0 flex flex-col items-center gap-1 rounded-xl border px-4 py-3 min-w-[92px] transition-all',
                        isSel
                          ? 'border-emerald-400/70 bg-emerald-500/10 ring-2 ring-emerald-400/40'
                          : 'border-white/10 bg-white/5 hover:border-white/30',
                      )}
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      <span className="text-[11px] font-medium text-white/80 text-center leading-tight">
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {sharedFeatures.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-white/80">
                  <Check className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to={`/auth?next=${encodeURIComponent(next)}&plan=${current.id}`}
              className="block text-center w-full rounded-xl py-3 font-semibold transition-transform hover:scale-[1.02] bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              Empezar con {current.label}
            </Link>
          </div>

          <div className="relative rounded-2xl border border-violet-500/60 bg-violet-500/5 p-8 flex flex-col shadow-[0_0_60px_-20px_hsl(280_80%_60%/0.6)]">
            <div className="text-xs uppercase tracking-wider text-violet-300 mb-3">Especializado</div>
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${productionPlan.color} flex items-center justify-center text-3xl mb-5`}>
              {productionPlan.emoji}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{productionPlan.label}</h2>
            <p className="text-sm text-white/60 mb-5">{productionPlan.description}</p>

            <div className="mb-6">
              <span className="text-5xl font-black text-white">$99</span>
              <span className="text-white/50 text-base"> USD / mes</span>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {productionExtras.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-white/80">
                  <Check className="w-4 h-4 mt-0.5 text-violet-300 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to={`/auth?next=${encodeURIComponent(next)}&plan=production`}
              onClick={() => {
                savePendingCheckout('production');
                savePendingInstrument('production');
              }}
              className="block text-center w-full rounded-xl py-3 font-semibold transition-transform hover:scale-[1.02] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
            >
              Empezar con Producción
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-10 max-w-xl mx-auto">
          Al suscribirte aceptas nuestros{' '}
          <Link to="/terminos" className="underline hover:text-white">Términos</Link>,{' '}
          <Link to="/privacidad" className="underline hover:text-white">Política de Privacidad</Link>{' '}
          y{' '}
          <Link to="/politica-de-cancelacion" className="underline hover:text-white">Política de Cancelación</Link>.
        </p>
      </div>
    </PublicLayout>
  );
}
