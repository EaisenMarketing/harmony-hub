import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';

interface Plan {
  id: 'standard' | 'pro' | 'production';
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'standard',
    name: 'Estándar',
    price: '$45',
    tagline: 'Un instrumento a tu ritmo.',
    features: [
      'Acceso completo a un instrumento',
      'Una clase grupal en vivo por semana',
      'Materiales de estudio',
      'Herramientas educativas incluidas',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$75',
    tagline: 'Todos los instrumentos y feedback del maestro.',
    highlight: true,
    features: [
      'Acceso a todos los instrumentos',
      'Todo lo incluido en Estándar',
      'Envío de prácticas y grabaciones al maestro',
      'Retroalimentación periódica',
      'Material avanzado descargable',
    ],
  },
  {
    id: 'production',
    name: 'Producción Musical',
    price: '$99',
    tagline: 'Todo lo de Pro más producción musical completa.',
    features: [
      'Todo lo incluido en Pro',
      'Clases de producción musical',
      'DAWs, grabación, mezcla y mastering',
      'Tareas y materiales de producción',
    ],
  },
];

export default function PricingPage() {
  const [params] = useSearchParams();
  const courseHint = params.get('course');
  const next = courseHint ? `/cursos/${courseHint}` : '/portal';

  return (
    <PublicLayout>
      <Seo
        title="Precios y planes"
        description="Planes mensuales de Acorde Live: Estándar $45, Pro $75 y Producción Musical $99. Cancela cuando quieras."
        path="/precios"
      />
      <div className="container mx-auto px-4 py-14">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Elige tu plan</h1>
          <p className="text-white/60">
            Suscripción mensual, sin permanencia. Puedes cancelar cuando quieras y conservas tu progreso.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-primary/50 bg-primary/5 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {plan.highlight && (
                <div className="text-xs uppercase tracking-wider text-primary mb-3">Más elegido</div>
              )}
              <h2 className="text-2xl font-bold text-white mb-1">{plan.name}</h2>
              <p className="text-sm text-white/60 mb-4">{plan.tagline}</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-white/50"> USD / mes</span>
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={`/auth?next=${encodeURIComponent(next)}&plan=${plan.id}`}
                className={`block text-center w-full rounded-xl py-3 font-semibold transition-transform hover:scale-[1.02] ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-indigo-600 to-emerald-500 text-white'
                    : 'border border-white/20 text-white hover:bg-white/10'
                }`}
              >
                Elegir {plan.name}
              </Link>
            </div>
          ))}
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
