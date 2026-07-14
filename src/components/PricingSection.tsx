import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { INSTRUMENT_PLANS, type InstrumentSlug } from '@/lib/instrument-access';
import { cn } from '@/lib/utils';

const sharedFeatures = [
  'Acceso completo a los cursos del instrumento',
  '1 clase grupal en vivo por semana',
  'Herramientas de IA específicas del instrumento',
  'Comunidad y feedback del maestro',
  'Certificado oficial al terminar',
];

const productionExtras = [
  'Cursos de DAW, mezcla y mastering',
  'Clases en vivo de producción musical',
  'Biblioteca de samples y presets',
  'Tareas y material descargable',
];

const instrumentOptions = INSTRUMENT_PLANS.filter((p) => p.id !== 'production');
const productionPlan = INSTRUMENT_PLANS.find((p) => p.id === 'production')!;

export function PricingSection() {
  const [selected, setSelected] = useState<InstrumentSlug>(instrumentOptions[0].id);
  const current = instrumentOptions.find((p) => p.id === selected)!;

  return (
    <section id="precios" className="py-24 premium-surface relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-emerald-400 text-sm font-semibold mb-4">
            Un plan por instrumento
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Un precio, <span className="gradient-text">tu instrumento</span>
          </h2>
          <p className="text-lg text-white/60">
            $75/mes por cualquier instrumento. Producción Musical incluye contenido especializado
            por $99/mes.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 max-w-5xl mx-auto items-stretch">
          {/* Card principal: $75 + selector */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 flex flex-col">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center text-3xl mb-5 transition-all`}>
              {current.emoji}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{current.label}</h3>
            <p className="text-sm text-white/60 mb-5">{current.description}</p>

            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$75</span>
              <span className="text-white/50 text-base"> USD / mes</span>
            </div>

            {/* Selector deslizable de instrumentos */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-white/50 mb-3">
                Elige tu instrumento
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
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
              {sharedFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/70">{f}</span>
                </li>
              ))}
            </ul>

            <Link to={`/auth?plan=${current.id}`} className="block">
              <Button variant="gradient" className="w-full" size="lg">
                Empezar con {current.label}
              </Button>
            </Link>
          </div>

          {/* Card Producción Musical al lado */}
          <div className="relative rounded-2xl border border-violet-500/60 bg-white/5 backdrop-blur-sm p-8 flex flex-col shadow-[0_0_60px_-20px_hsl(280_80%_60%/0.6)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold">
              Especializado
            </div>
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${productionPlan.color} flex items-center justify-center text-3xl mb-5`}>
              {productionPlan.emoji}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{productionPlan.label}</h3>
            <p className="text-sm text-white/60 mb-5">{productionPlan.description}</p>

            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$99</span>
              <span className="text-white/50 text-base"> USD / mes</span>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {productionExtras.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-violet-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/70">{f}</span>
                </li>
              ))}
            </ul>

            <Link to={`/auth?plan=production`} className="block">
              <Button variant="gradient" className="w-full" size="lg">
                Empezar con Producción
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mt-10">
          <p className="text-white/50 text-sm">
            ✓ Cancela cuando quieras · ✓ Cambia de instrumento en Configuración · ✓ Sin permanencia
          </p>
        </div>
      </div>
    </section>
  );
}
