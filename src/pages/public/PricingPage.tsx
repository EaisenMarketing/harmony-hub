import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import {
  MEMBERSHIP_PLANS,
  PRIVATE_LESSON_OPTIONS,
  TRIAL_DAYS,
  TRIAL_DISCLAIMER,
  formatMoney,
} from '@/lib/membership';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  return (
    <PublicLayout>
      <Seo
        title="Precios y planes de membresía"
        description={`Membresías Acorde Live: Esencial $29.99, Pro $49.99 y Premium $69.99 al mes. ${TRIAL_DAYS} días de prueba gratis y 1 instrumento activo. Cancela cuando quieras.`}
        path="/precios"
      />
      <div className="container mx-auto px-4 py-14">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-emerald-400 text-sm font-semibold mb-4">
            Prueba gratis {TRIAL_DAYS} días
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Elige tu membresía</h1>
          <p className="text-white/60">
            Todos los planes incluyen 1 instrumento activo y 1 clase grupal en vivo por semana.
            Lo que cambia son los beneficios.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {MEMBERSHIP_PLANS.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                'relative rounded-2xl border bg-white/[0.03] p-8 flex flex-col',
                plan.popular
                  ? 'border-emerald-400/60 shadow-[0_0_60px_-20px_hsl(160_84%_39%/0.6)]'
                  : 'border-white/10',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full gradient-bg text-white text-xs font-semibold">
                  Más elegido
                </div>
              )}
              <h2 className="text-2xl font-bold text-white mb-1">{plan.name}</h2>
              <p className="text-sm text-white/60 mb-5">{plan.tagline}</p>

              <div className="mb-6">
                <span className="text-4xl font-black text-white">{formatMoney(plan.priceUsd)}</span>
                <span className="text-white/50 text-base"> / mes</span>
                <p className="text-xs text-emerald-400 mt-1">$0 hoy · {TRIAL_DAYS} días de prueba</p>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={`/empezar?plan=${plan.key}`}
                className={cn(
                  'block text-center w-full rounded-xl py-3 font-semibold transition-transform hover:scale-[1.02]',
                  plan.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                    : 'border border-white/15 text-white hover:bg-white/5',
                )}
              >
                Comenzar con {plan.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-xl font-bold text-white mb-2">Clases privadas (complemento)</h2>
          <p className="text-sm text-white/60 mb-6">
            No están incluidas en ningún plan. Puedes agregarlas cuando quieras.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {PRIVATE_LESSON_OPTIONS.map((opt) => (
              <div key={opt.type} className="rounded-xl border border-white/10 p-5">
                <p className="text-white font-semibold">{opt.label}</p>
                <p className="text-sm text-white/50 mb-3">{opt.duration}</p>
                <p className="text-2xl font-black text-white">{formatMoney(opt.priceUsd)}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-10 max-w-xl mx-auto">
          {TRIAL_DISCLAIMER} Al suscribirte aceptas nuestros{' '}
          <Link to="/terminos" className="underline hover:text-white">Términos</Link>,{' '}
          <Link to="/privacidad" className="underline hover:text-white">Política de Privacidad</Link>{' '}
          y{' '}
          <Link to="/politica-de-cancelacion" className="underline hover:text-white">Política de Cancelación</Link>.
        </p>
      </div>
    </PublicLayout>
  );
}
