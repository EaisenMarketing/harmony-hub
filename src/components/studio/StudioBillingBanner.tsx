import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Users } from 'lucide-react';
import { TEACHER_PLAN_MAP } from '@/lib/teacher-plans';
import { useStudioStatus, type TeacherAccount } from '@/hooks/useTeacherStudio';

/**
 * Muestra el estado de la suscripción del estudio: prueba por vencer,
 * suscripción vencida/suspendida o cupos casi llenos.
 */
export const StudioBillingBanner = ({ account }: { account: TeacherAccount }) => {
  const { data: status } = useStudioStatus(account.id);
  if (!status) return null;

  const plan = TEACHER_PLAN_MAP[account.plan];
  const seatsLeft = Math.max(0, status.seat_limit - status.seats_used);

  if (!status.is_active) {
    return (
      <Card className="p-4 border-destructive/40 bg-destructive/10 space-y-2">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Tu estudio está inactivo</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {status.status === 'trial'
            ? 'Tu prueba gratuita terminó. Activa un plan para volver a agregar alumnos y programar clases.'
            : 'Tu suscripción de maestro no está activa. Renueva tu plan para reactivar el acceso de tus alumnos.'}
        </p>
        <Button size="sm" asChild>
          <Link to="/maestros/planes">Ver planes para maestros</Link>
        </Button>
      </Card>
    );
  }

  if (status.status === 'trial') {
    return (
      <Card className="p-4 border-primary/30 bg-primary/10 space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="w-4 h-4" />
          <h3 className="text-sm font-semibold">
            Prueba del plan {plan.label}
            {status.days_left !== null ? ` · ${status.days_left} día(s) restantes` : ''}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Durante la prueba puedes invitar hasta {status.seat_limit} alumnos y usar todas las herramientas.
        </p>
        <Button size="sm" variant="outline" asChild>
          <Link to="/maestros/planes">Activar plan ${plan.price}/mes</Link>
        </Button>
      </Card>
    );
  }

  if (seatsLeft <= Math.max(1, Math.round(status.seat_limit * 0.1))) {
    return (
      <Card className="p-4 border-white/10 bg-card/70 space-y-2">
        <div className="flex items-center gap-2 text-foreground">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Te quedan {seatsLeft} cupo(s) de {status.seat_limit}
          </h3>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/estudio/configuracion">Subir de plan</Link>
        </Button>
      </Card>
    );
  }

  return null;
};
