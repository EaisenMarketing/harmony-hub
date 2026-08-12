import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MEMBERSHIP_PLANS, TRIAL_DAYS, TRIAL_DISCLAIMER, formatMoney } from '@/lib/membership';
import { cn } from '@/lib/utils';

export function PricingSection() {
  return (
    <section id="precios" className="py-24 premium-surface relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-emerald-400 text-sm font-semibold mb-4">
            Prueba gratis {TRIAL_DAYS} días
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Elige tu <span className="gradient-text">membresía</span>
          </h2>
          <p className="text-lg text-white/60">
            Tres planes, un instrumento activo en cada uno. Empieza con {TRIAL_DAYS} días gratis y
            cancela antes si no es para ti.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {MEMBERSHIP_PLANS.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                'relative rounded-2xl border bg-white/[0.03] backdrop-blur-sm p-8 flex flex-col',
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
              <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-white/60 mb-5">{plan.tagline}</p>

              <div className="mb-6">
                <span className="text-4xl font-black text-white">{formatMoney(plan.priceUsd)}</span>
                <span className="text-white/50 text-base"> / mes</span>
                <p className="text-xs text-emerald-400 mt-1">$0 hoy · {TRIAL_DAYS} días de prueba</p>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/70">{f}</span>
                  </li>
                ))}
              </ul>

              <Link to={`/empezar?plan=${plan.key}`} className="block">
                <Button
                  variant={plan.popular ? 'gradient' : 'outline'}
                  size="lg"
                  className={cn('w-full', !plan.popular && 'border-white/15 text-white hover:bg-white/5')}
                >
                  Comenzar con {plan.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-white/40 text-sm mt-10 max-w-2xl mx-auto">{TRIAL_DISCLAIMER}</p>
      </div>
    </section>
  );
}
