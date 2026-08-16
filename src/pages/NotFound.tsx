import { Link, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

// Cualquier variante de ruta de acceso/registro va al login en lugar de dar 404.
const AUTH_ALIASES = [
  "/signin", "/sign-in", "/signup", "/sign-up", "/register", "/log-in", "/logout",
  "/acceso", "/entrar", "/ingresar", "/iniciar-sesion", "/iniciar", "/crear-cuenta",
  "/cuenta", "/registrarse", "/registrarme", "/sesion", "/auth/login", "/auth/signup",
  "/auth/register", "/auth/sign-in", "/auth/sign-up", "/email-login", "/login-email",
];

const NotFound = () => {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, "").toLowerCase();

  const isAuthAlias =
    AUTH_ALIASES.includes(path) ||
    path.startsWith("/auth") ||
    path.startsWith("/login") ||
    path.startsWith("/registro");

  // Enlaces de email de Supabase que caen en una ruta inesperada.
  const hasAuthToken =
    window.location.hash.includes("access_token") ||
    window.location.hash.includes("type=recovery") ||
    new URLSearchParams(window.location.search).has("code");

  useEffect(() => {
    if (!isAuthAlias && !hasAuthToken) {
      console.error("404: ruta inexistente:", location.pathname);
    }
  }, [location.pathname, isAuthAlias, hasAuthToken]);

  if (hasAuthToken) {
    return <Navigate to={`/auth/callback${window.location.search}${window.location.hash}`} replace />;
  }

  if (isAuthAlias) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <h1 className="mb-3 text-5xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          No encontramos esta página.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Ir al inicio
          </Link>
          <Link
            to="/auth"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
