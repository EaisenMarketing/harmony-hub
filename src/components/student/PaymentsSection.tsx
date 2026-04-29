import { CreditCard, Check, Crown, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStudentProfile } from '@/hooks/useStudentData';

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    price: 0,
    description: 'Perfecto para comenzar tu viaje musical',
    icon: Zap,
    features: [
      'Primeras 3 lecciones de cada curso',
      'Metrónomo y afinador básico',
      'Calendario visible',
    ],
  },
  {
    id: 'standard',
    name: 'Estándar',
    price: 45,
    description: 'Acceso completo a un instrumento',
    icon: Star,
    popular: true,
    features: [
      'Acceso completo a 1 instrumento',
      '1 clase grupal en vivo por semana (1hr)',
      'Herramientas de IA (acordes y teoría)',
      'Sala de Práctica: Rítmica, Batería y Progresiones',
      'Material descargable',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 75,
    description: 'Acceso total + comunidad y grabaciones',
    icon: Crown,
    features: [
      'Acceso a TODOS los instrumentos',
      'Todo lo del plan Estándar',
      'Galería de acordes avanzados (PDF descargable)',
      'Grabaciones de práctica → enviar al maestro',
      'Comunidad estilo Facebook (publicar, likes, comentarios)',
      'Feedback 1:1 mensual + Certificados oficiales',
    ],
  },
  {
    id: 'production',
    name: 'Producción Musical',
    price: 99,
    description: 'Todo lo del Pro + producción musical',
    icon: Crown,
    features: [
      'Todo lo incluido en el plan Pro',
      'Clases de producción musical mensual',
      'Acceso a DAWs, mezcla y mastering',
      'Tareas y material descargable (PDF)',
      'Grabación y técnicas de estudio',
    ],
  },
];

export const PaymentsSection = () => {
  const { data: profile } = useStudentProfile();
  const currentPlan = profile?.subscription_plan || 'basic';

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
              <h2 className="text-2xl font-bold text-foreground capitalize">
                {currentPlan === 'basic' ? 'Básico' : currentPlan === 'standard' ? 'Estándar' : currentPlan === 'production' ? 'Producción Musical' : 'Pro'}
              </h2>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const Icon = plan.icon;

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative transition-all',
                  plan.popular && 'border-primary shadow-lg',
                  isCurrentPlan && 'ring-2 ring-primary'
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Más Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'secondary' : plan.popular ? 'default' : 'outline'}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Plan Actual' : 'Seleccionar Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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
