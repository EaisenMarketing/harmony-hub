import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEntitlement } from '@/hooks/useMembership';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

/**
 * Bloquea cualquier contenido de alumno hasta que exista una membresía real
 * (prueba activa, suscripción activa o acceso vía estudio de maestro).
 * Sin sesión -> /auth. Con sesión pero sin membresía -> /empezar.
 */
export const RequireMembership = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { data: ent, isLoading, isError } = useEntitlement();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (isLoading) return <Spinner />;

  const allowed =
    !!ent && (ent.is_admin || ent.status === 'trialing' || ent.status === 'active');

  // Si la consulta falla, no abrimos el portal (fail-closed).
  if (isError || !allowed) return <Navigate to="/empezar" replace />;

  return <>{children}</>;
};

export default RequireMembership;
