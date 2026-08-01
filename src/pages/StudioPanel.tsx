import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTeacherAccount } from '@/hooks/useTeacherStudio';
import { StudioSidebar, studioNav, isStudioActive } from '@/components/studio/StudioSidebar';
import { StudioMobileNav } from '@/components/studio/StudioMobileNav';
import { StudioOnboarding } from '@/components/studio/StudioOnboarding';
import { StudioDashboard } from '@/components/studio/StudioDashboard';
import { StudioStudents } from '@/components/studio/StudioStudents';
import { StudioCourses } from '@/components/studio/StudioCourses';
import { StudioAssignments } from '@/components/studio/StudioAssignments';
import { StudioTools } from '@/components/studio/StudioTools';
import { StudioSettings } from '@/components/studio/StudioSettings';
import { Music } from 'lucide-react';

const StudioPanel = () => {
  const { user, loading } = useAuth();
  const { data: account, isLoading } = useMyTeacherAccount();
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

  const content = () => {
    if (pathname.startsWith('/estudio/alumnos')) return <StudioStudents account={account} />;
    if (pathname.startsWith('/estudio/cursos')) return <StudioCourses account={account} />;
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
          {content()}
        </div>
      </main>

      <StudioMobileNav />
    </div>
  );
};

export default StudioPanel;
