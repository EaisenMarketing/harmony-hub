import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resolveDestination } from '@/lib/auth-redirect';

/**
 * Destino de los enlaces de email (verificación / magic link / OAuth).
 * Supabase deja el token en el hash o en ?code=, aquí lo resolvemos y
 * enviamos al usuario a su panel correspondiente. Nunca debe dar 404.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;

    const finish = async () => {
      if (done) return;
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      done = true;
      const dest = await resolveDestination(user.id);
      navigate(dest, { replace: true });
    };

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(window.location.search);
    const errDesc = hash.get('error_description') || search.get('error_description');

    if (hash.get('type') === 'recovery' || search.get('type') === 'recovery') {
      navigate(`/reset-password${window.location.hash}`, { replace: true });
      return;
    }

    if (errDesc) {
      setError(errDesc);
      const t = window.setTimeout(() => navigate('/auth', { replace: true }), 2500);
      return () => window.clearTimeout(t);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      finish();
    });
    finish();

    // Si no llega sesión (enlace ya usado), mandamos al login.
    const fallback = window.setTimeout(() => {
      if (!done) navigate('/auth', { replace: true });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">
        {error ? `No pudimos validar el enlace: ${error}` : 'Confirmando tu cuenta…'}
      </p>
    </div>
  );
};

export default AuthCallback;
