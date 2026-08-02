import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logo from '@/assets/logo.webp';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin, useAdminStats } from '@/hooks/useAdminData';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts';
import { InstructorsManagement } from '@/components/admin/InstructorsManagement';
import { InstructorApplicationsManagement } from '@/components/admin/InstructorApplicationsManagement';
import { CoursesTable } from '@/components/admin/CoursesTable';
import { LiveClassesTable } from '@/components/admin/LiveClassesTable';
import { StudentsTable } from '@/components/admin/StudentsTable';
import { VideoLibrary } from '@/components/admin/VideoLibrary';
import { ProductionManagement } from '@/components/admin/ProductionManagement';
import { FreeMaterialsManagement } from '@/components/admin/FreeMaterialsManagement';
import { CrmDashboard } from '@/components/admin/CrmDashboard';
import { TeacherAccountsManagement } from '@/components/admin/TeacherAccountsManagement';
import { LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminPanel = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: stats } = useAdminStats();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && isAdmin === false) {
      navigate('/portal');
    }
  }, [isAdmin, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const currentPath = location.pathname;

  const renderContent = () => {
    if (currentPath === '/admin/instructores') {
      return <InstructorsManagement />;
    }
    if (currentPath === '/admin/aplicaciones') {
      return <InstructorApplicationsManagement />;
    }
    if (currentPath === '/admin/cursos') {
      return <CoursesTable />;
    }
    if (currentPath === '/admin/videos') {
      return <VideoLibrary />;
    }
    if (currentPath === '/admin/produccion') {
      return <ProductionManagement />;
    }
    if (currentPath === '/admin/clases') {
      return <LiveClassesTable />;
    }
    if (currentPath === '/admin/estudiantes') {
      return <StudentsTable />;
    }
    if (currentPath === '/admin/crm') {
      return <CrmDashboard />;
    }
    if (currentPath === '/admin/maestros-b2b') {
      return <TeacherAccountsManagement />;
    }
    if (currentPath === '/admin/materiales') {
      return <FreeMaterialsManagement />;
    }
    if (currentPath === '/admin/estadisticas') {
      return (
        <div className="space-y-6">
          <AdminStats
            totalCourses={stats?.totalCourses || 0}
            totalStudents={stats?.totalStudents || 0}
            upcomingClasses={stats?.upcomingClasses || 0}
            completedLessons={stats?.completedLessons || 0}
          />
          <AdminDashboardCharts />
        </div>
      );
    }

    // Dashboard home - Show instructor activity dashboard
    return (
      <div className="space-y-8">
        <AdminDashboardCharts />
        <div className="grid lg:grid-cols-2 gap-6">
          <CoursesTable />
          <LiveClassesTable />
        </div>
      </div>
    );
  };

  const getPageInfo = () => {
    switch (currentPath) {
      case '/admin':
        return { title: 'Panel de Administración', subtitle: 'Visualiza la actividad de instructores y gestiona la plataforma' };
      case '/admin/instructores':
        return { title: 'Gestión de Instructores', subtitle: 'Autoriza y gestiona los maestros por instrumento' };
      case '/admin/aplicaciones':
        return { title: 'Aplicaciones de Maestros', subtitle: 'Revisa y aprueba a los maestros que postulan' };
      case '/admin/cursos':
        return { title: 'Gestión de Cursos', subtitle: 'Administra todos los cursos de la plataforma' };
      case '/admin/videos':
        return { title: 'Biblioteca de Videos', subtitle: 'Visualiza todos los videos organizados por instrumento' };
      case '/admin/produccion':
        return { title: 'Producción Musical', subtitle: 'Gestiona clases, videos, tareas y material de producción' };
      case '/admin/clases':
        return { title: 'Clases en Vivo', subtitle: 'Gestiona las clases en vivo programadas' };
      case '/admin/estudiantes':
        return { title: 'Estudiantes', subtitle: 'Visualiza todos los estudiantes registrados' };
      case '/admin/materiales':
        return { title: 'Material Gratis / CRM', subtitle: 'Sube PDFs gratuitos y captura leads desde Instagram' };
      case '/admin/maestros-b2b':
        return { title: 'Maestros B2B', subtitle: 'Suscripciones, cupos de alumnos y estado de cada estudio' };
      case '/admin/crm':
        return { title: 'CRM de Leads', subtitle: 'Todos los leads de tus enlaces de material gratuito y del formulario de contacto' };
      case '/admin/estadisticas':
        return { title: 'Estadísticas', subtitle: 'Métricas y gráficas de la plataforma' };
      case '/admin/configuracion':
        return { title: 'Configuración', subtitle: 'Configuración general de la plataforma' };
      default:
        return { title: 'Panel de Administración', subtitle: 'Gestiona todo el contenido de la plataforma' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="admin-mobile-shell min-h-screen bg-background flex overflow-x-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Mobile top header like student portal */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 pt-12 pb-3 bg-background/95 backdrop-blur-sm border-b border-border md:hidden">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img loading="lazy" decoding="async" src={logo} alt="Acorde Live" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            <span className="font-bold text-foreground truncate">Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2 shrink-0"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </header>

        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
          <header className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight break-words">
                {pageInfo.title}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {pageInfo.subtitle}
              </p>
            </div>
          </header>

          {renderContent()}
        </div>
      </main>

      <AdminMobileNav />
    </div>
  );
};

export default AdminPanel;
