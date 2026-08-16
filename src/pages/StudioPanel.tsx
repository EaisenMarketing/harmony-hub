import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTeacherAccount, useStudioStatus } from '@/hooks/useTeacherStudio';
import { StudioSidebar, studioNav, isStudioActive } from '@/components/studio/StudioSidebar';
import { StudioMobileNav } from '@/components/studio/StudioMobileNav';
import { StudioOnboarding } from '@/components/studio/StudioOnboarding';
import { StudioDashboard } from '@/components/studio/StudioDashboard';
import { StudioStudents } from '@/components/studio/StudioStudents';
import { StudioCourses } from '@/components/studio/StudioCourses';
import { StudioAssignments } from '@/components/studio/StudioAssignments';
import { StudioLiveClasses } from '@/components/studio/StudioLiveClasses';
import { StudioAnnouncements } from '@/components/studio/StudioAnnouncements';
import { StudioTools } from '@/components/studio/StudioTools';
import { StudioSettings } from '@/components/studio/StudioSettings';
import { StudioBillingBanner } from '@/components/studio/StudioBillingBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Music, Lock } from 'lucide-react';

const StudioPanel = () => {
  const { user, loading } = useAuth();
  const { data: account, isLoading } = useMyTeacherAccount();
  const { data: studioStatus } = useStudioStatus(account?.id);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (!account) return <StudioOnboarding />;

  const title = studioNav.find((i) => isStudioActive(pathname, i.href))?.name ?? 'Mi Estudio';

  const locked = studioStatus ? !studioStatus.is_active : false;
  const alwaysAllowed = pathname === '/estudio' || pathname.startsWith('/estudio/configuracion');

  const content = () => {
    if (locked && !alwaysAllowed) {
      return (
        <Card className="p-6 bg-card/70 border-white/10 text-center space-y-3">
          <Lock className="w-8 h-8 text-primary mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Sección bloqueada</h2>
          <p className="text-sm text-muted-foreground">
            Activa o renueva tu plan de maestro para volver a usar cursos, clases, tareas y herramientas.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild>
              <Link to="/maestros/planes">Ver planes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/estudio/configuracion">Elegir plan en configuración</Link>
            </Button>
          </div>
        </Card>
      );
    }
    if (pathname.startsWith('/estudio/alumnos')) return <StudioStudents account={account} />;
    if (pathname.startsWith('/estudio/cursos')) return <StudioCourses account={account} />;
    if (pathname.startsWith('/estudio/clases')) return <StudioLiveClasses account={account} />;
    if (pathname.startsWith('/estudio/avisos')) return <StudioAnnouncements account={account} />;
    if (pathname.startsWith('/estudio/tareas')) return <StudioAssignments account={account} />;
    if (pathname.startsWith('/estudio/herramientas')) return <StudioTools account={account} />;
    if (pathname.startsWith('/estudio/configuracion')) return <StudioSettings account={account} />;
    return <StudioDashboard account={account} />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <StudioSidebar />
      </div>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <header className="md:hidden sticky top-0 z-30 border-b border-white/10 bg-premium-dark/80 backdrop-blur-xl px-4 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white truncate">{title}</h1>
              <p className="text-[11px] text-white/60 truncate">{account.studio_name}</p>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          <header className="hidden md:block">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm">{account.studio_name}</p>
          </header>
          <StudioBillingBanner account={account} />
          {content()}
        </div>
      </main>

      <StudioMobileNav />
    </div>
  );
};

export default StudioPanel;
