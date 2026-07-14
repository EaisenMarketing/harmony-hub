import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';

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

export default function PricingPage() {
  const [params] = useSearchParams();
  const courseHint = params.get('course');
  const next = courseHint ? `/cursos/${courseHint}` : '/portal';

  return (
    <PublicLayout>
      <Seo
        title="Precios y planes"
        description="Un plan por instrumento en Acorde Live. $75/mes por instrumento y $99/mes para Producción Musical. Cancela cuando quieras."
        path="/precios"
      />
      <div className="container mx-auto px-4 py-14">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Elige tu instrumento</h1>
          <p className="text-white/60">
            Cada plan te da acceso completo a un instrumento. Sin permanencia, cancela cuando quieras.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {INSTRUMENT_PLANS.map(plan => {
            const isProd = plan.id === 'production';
            const features = isProd ? productionExtras : sharedFeatures;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col ${
                  isProd
                    ? 'border-violet-500/60 bg-violet-500/5 shadow-[0_0_60px_-20px_hsl(280_80%_60%/0.6)]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {isProd && (
                  <div className="text-xs uppercase tracking-wider text-violet-300 mb-3">Especializado</div>
                )}
                <div className="text-3xl mb-2">{plan.emoji}</div>
                <h2 className="text-xl font-bold text-white mb-1">{plan.label}</h2>
                <p className="text-sm text-white/60 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-black text-white">${plan.price}</span>
                  <span className="text-white/50 text-sm"> USD / mes</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex gap-2 text-sm text-white/80">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/auth?next=${encodeURIComponent(next)}&plan=${plan.id}`}
                  className={`block text-center w-full rounded-xl py-3 font-semibold transition-transform hover:scale-[1.02] ${
                    isProd
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  Empezar
                </Link>
              </div>
            );
          })}
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
