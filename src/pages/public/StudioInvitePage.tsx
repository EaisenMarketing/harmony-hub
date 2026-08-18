import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioPublicProfile, useClaimStudioInvite } from '@/hooks/useTeacherStudio';
import { toast } from '@/hooks/use-toast';

const MESSAGES: Record<string, string> = {
  invalid_code: 'El enlace de invitación no es válido.',
  studio_inactive: 'Este estudio no está activo por el momento.',
  seats_full: 'El estudio ya no tiene cupos disponibles. Pídele a tu maestro que amplíe su plan.',
  not_authenticated: 'Inicia sesión para unirte.',
};

const StudioInvitePage = () => {
  const params = useParams<{ code?: string; slug?: string }>();
  const code = params.code ?? params.slug;
  const { user, loading } = useAuth();
  const { data: studio, isLoading } = useStudioPublicProfile(code);
  const claim = useClaimStudioInvite();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  const join = async () => {
    if (!code) return;
    try {
      const res = await claim.mutateAsync(code);
      if (res?.joined) {
        setDone(true);
        toast({ title: '¡Listo!', description: `Ya eres alumno de ${res.studio_name}.` });
        setTimeout(() => navigate('/portal'), 1200);
      } else {
        toast({
          title: 'No pudimos unirte',
          description: MESSAGES[res?.message ?? ''] ?? 'Intenta de nuevo.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!loading && user && studio && !done && !claim.isPending) {
      void join();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, studio]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-6 bg-card/70 border-white/10 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-primary/15">
          <Music className="w-6 h-6 text-primary" />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando invitación…</p>
        ) : !studio ? (
          <>
            <h1 className="text-xl font-bold text-foreground">Invitación no válida</h1>
            <p className="text-sm text-muted-foreground">{MESSAGES.invalid_code}</p>
            <Button asChild variant="outline">
              <Link to="/">Ir al inicio</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground">{studio.studio_name}</h1>
            <p className="text-sm text-muted-foreground">
              Tu maestro te invitó a su estudio en Acorde Live. Al unirte tendrás acceso a sus cursos, tareas y a las
              herramientas de práctica e IA.
            </p>
            {studio.bio && <p className="text-xs text-muted-foreground/80 italic">{studio.bio}</p>}

            {!user ? (
              <Button asChild className="w-full">
                <Link to={`/auth?next=${encodeURIComponent(window.location.pathname)}`}>
                  Crear cuenta o iniciar sesión
                </Link>
              </Button>
            ) : done ? (
              <p className="text-sm text-primary">¡Ya eres parte del estudio! Te llevamos a tu portal…</p>
            ) : (
              <Button className="w-full" onClick={join} disabled={claim.isPending}>
                {claim.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Unirme al estudio
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default StudioInvitePage;
