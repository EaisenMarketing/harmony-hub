import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Básico',
    price: '$0',
    period: '/mes',
    description: 'Perfecto para comenzar tu viaje musical',
    icon: Zap,
    features: [
      { text: 'Primeras 3 lecciones de cada curso', included: true },
      { text: 'Calendario visible', included: true },
      { text: 'Clases grupales en vivo', included: false },
      { text: 'Herramientas de IA', included: false },
      { text: 'Certificados', included: false },
    ],
    popular: false,
    color: 'border-border',
    buttonVariant: 'outline' as const,
  },
  {
    name: 'Estándar',
    price: '$45',
    period: '/mes',
    description: 'Acceso completo a un instrumento',
    icon: Sparkles,
    features: [
      { text: 'Acceso completo a 1 instrumento', included: true },
      { text: '1 clase grupal en vivo por semana (1hr)', included: true },
      { text: 'Herramientas de IA (acordes y teoría)', included: true },
      { text: 'Material descargable', included: true },
      { text: 'Feedback 1:1 mensual', included: false },
    ],
    popular: false,
    color: 'border-border',
    buttonVariant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: '$75',
    period: '/mes',
    description: 'Acceso total a todos los instrumentos',
    icon: Crown,
    features: [
      { text: 'Acceso a TODOS los instrumentos', included: true },
      { text: '1 clase grupal en vivo por semana (1hr)', included: true },
      { text: 'Feedback 1:1 mensual', included: true },
      { text: 'Certificados oficiales', included: true },
      { text: 'Prioridad en soporte', included: true },
    ],
    popular: true,
    color: 'border-primary/50',
    buttonVariant: 'gradient' as const,
  },
  {
    name: 'Producción Musical',
    price: '$99',
    period: '/mes',
    description: 'Todo lo del Pro + clases de producción',
    icon: Crown,
    features: [
      { text: 'Todo lo incluido en el plan Pro', included: true },
      { text: 'Clases de producción musical mensual', included: true },
      { text: 'Acceso a DAWs, mezcla y mastering', included: true },
      { text: 'Tareas y material descargable (PDF)', included: true },
      { text: 'Grabación y técnicas de estudio', included: true },
    ],
    popular: false,
    color: 'border-emerald-500',
    buttonVariant: 'default' as const,
  },
];

export function PricingSection() {
  return (
    <section id="precios" className="py-24 premium-surface relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-emerald-400 text-sm font-semibold mb-4">
            Planes y Precios
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Invierte en tu{' '}
            <span className="gradient-text">talento musical</span>
          </h2>
          <p className="text-lg text-white/60">
            Elige el plan que mejor se adapte a tus objetivos. Cancela cuando quieras.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 ${plan.color} bg-white/5 backdrop-blur-sm p-8 transition-all duration-500 hover:-translate-y-2 ${
                plan.popular ? 'scale-105 shadow-2xl' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-sm font-semibold">
                  Más Popular
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${plan.popular ? 'bg-gradient-to-br from-indigo-600 to-emerald-500' : 'bg-white/10'} flex items-center justify-center mb-6`}>
                <plan.icon className="w-7 h-7 text-white" />
              </div>

              {/* Plan Info */}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-white/50 text-sm mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-white/50">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-white/30 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-white/80' : 'text-white/30'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/auth" className="block">
                <Button
                  variant={plan.buttonVariant}
                  className={`w-full ${plan.popular ? '' : 'border-white/20 text-white hover:bg-white/10'}`}
                  size="lg"
                >
                  {plan.popular ? 'Comenzar Ahora' : 'Elegir Plan'}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-white/50 text-sm">
            ✓ Facturación mensual y anual disponible · ✓ Garantía de 30 días · ✓ Cupones y referidos
          </p>
        </div>
      </div>
    </section>
  );
}
