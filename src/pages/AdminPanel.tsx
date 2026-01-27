import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin, useAdminStats } from '@/hooks/useAdminData';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminStats } from '@/components/admin/AdminStats';
import { CoursesTable } from '@/components/admin/CoursesTable';
import { LiveClassesTable } from '@/components/admin/LiveClassesTable';
import { StudentsTable } from '@/components/admin/StudentsTable';
import { VideoLibrary } from '@/components/admin/VideoLibrary';
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
    if (currentPath === '/admin/cursos') {
      return <CoursesTable />;
    }
    if (currentPath === '/admin/videos') {
      return <VideoLibrary />;
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
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico de ingresos (próximamente)</p>
            </div>
            <div className="h-64 bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico de retención (próximamente)</p>
            </div>
          </div>
        </div>
      );
    }

    // Dashboard home
    return (
      <div className="space-y-8">
        <AdminStats
          totalCourses={stats?.totalCourses || 0}
          totalStudents={stats?.totalStudents || 0}
          upcomingClasses={stats?.upcomingClasses || 0}
          completedLessons={stats?.completedLessons || 0}
        />
        <div className="grid lg:grid-cols-2 gap-6">
          <CoursesTable />
          <LiveClassesTable />
        </div>
      </div>
    );
  };

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
                {currentPath === '/admin' && 'Panel de Administración'}
                {currentPath === '/admin/cursos' && 'Gestión de Cursos'}
                {currentPath === '/admin/videos' && 'Biblioteca de Videos'}
                {currentPath === '/admin/clases' && 'Clases en Vivo'}
                {currentPath === '/admin/estudiantes' && 'Estudiantes'}
                {currentPath === '/admin/estadisticas' && 'Estadísticas'}
                {currentPath === '/admin/configuracion' && 'Configuración'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {currentPath === '/admin/videos' 
                  ? 'Visualiza todos los videos organizados por instrumento'
                  : 'Gestiona todo el contenido de la plataforma'}
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
