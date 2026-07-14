import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';

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

export function PricingSection() {
  return (
    <section id="precios" className="py-24 premium-surface relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-emerald-400 text-sm font-semibold mb-4">
            Un plan por instrumento
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Elige tu <span className="gradient-text">instrumento</span>
          </h2>
          <p className="text-lg text-white/60">
            Cada plan te da acceso completo a un instrumento. Precio único de $75/mes.
            Producción Musical incluye contenido especializado por $99/mes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {INSTRUMENT_PLANS.map((plan) => {
            const isProd = plan.id === 'production';
            const features = isProd ? productionExtras : sharedFeatures;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col bg-white/5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 ${
                  isProd
                    ? 'border-violet-500/60 shadow-[0_0_60px_-20px_hsl(280_80%_60%/0.6)]'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {isProd && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold">
                    Especializado
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-2xl mb-4`}>
                  {plan.emoji}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{plan.label}</h3>
                <p className="text-xs text-white/50 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/50 text-sm">/mes</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-white/70">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/auth?plan=${plan.id}`} className="block">
                  <Button
                    variant={isProd ? 'gradient' : 'outline'}
                    className={`w-full ${isProd ? '' : 'border-white/20 text-white hover:bg-white/10'}`}
                    size="sm"
                  >
                    Empezar con {plan.label.split(' ')[0]}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-white/50 text-sm">
            ✓ Cancela cuando quieras · ✓ Cambia de instrumento en Configuración · ✓ Sin permanencia
          </p>
        </div>
      </div>
    </section>
  );
}
