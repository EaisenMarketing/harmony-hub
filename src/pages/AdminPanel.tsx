import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { Shield } from 'lucide-react';

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
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
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
          {/* Header */}
          <header className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {pageInfo.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {pageInfo.subtitle}
              </p>
            </div>
          </header>

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
