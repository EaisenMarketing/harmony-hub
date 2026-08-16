import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsInstructor, useInstructorProfile } from '@/hooks/useInstructorData';
import { InstructorSidebar } from '@/components/instructor/InstructorSidebar';
import { InstructorMobileNav } from '@/components/instructor/InstructorMobileNav';
import { InstructorDashboard } from '@/components/instructor/InstructorDashboard';
import { InstructorStudents } from '@/components/instructor/InstructorStudents';
import { InstructorCourses } from '@/components/instructor/InstructorCourses';
import { InstructorClasses } from '@/components/instructor/InstructorClasses';
import { InstructorPendingApproval } from '@/components/instructor/InstructorPendingApproval';
import { InstructorQuestionsInbox } from '@/components/instructor/InstructorQuestionsInbox';
import { Music } from 'lucide-react';
import { instrumentLabel } from '@/lib/instruments';

const InstructorPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isInstructor, isLoading: instructorLoading } = useIsInstructor();
  const { data: profile, isLoading: profileLoading } = useInstructorProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || instructorLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If user is not an approved instructor, show pending/request page
  if (!isInstructor || !profile || profile.status !== 'approved') {
    return <InstructorPendingApproval profile={profile} />;
  }

  const currentPath = location.pathname;

  const renderContent = () => {
    if (currentPath === '/instructor/alumnos') {
      return <InstructorStudents />;
    }
    if (currentPath === '/instructor/cursos') {
      return <InstructorCourses />;
    }
    if (currentPath === '/instructor/clases') {
      return <InstructorClasses />;
    }
    if (currentPath === '/instructor/consultas') {
      return <InstructorQuestionsInbox />;
    }
    // Dashboard home
    return <InstructorDashboard />;
  };

  const getPageTitle = () => {
    if (currentPath === '/instructor/alumnos') return 'Mis Alumnos';
    if (currentPath === '/instructor/cursos') return 'Mis Cursos';
    if (currentPath === '/instructor/clases') return 'Mis Clases';
    if (currentPath === '/instructor/consultas') return 'Consultas de Alumnos';
    return 'Panel de Instructor';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <InstructorSidebar />
      </div>

      <main
        className="flex-1 overflow-y-auto pb-24 md:pb-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Mobile sticky header (iOS-style, blurred) */}
        <header className="md:hidden sticky top-0 z-30 border-b border-white/10 bg-premium-dark/80 backdrop-blur-xl px-4 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white truncate">
                {getPageTitle()}
              </h1>
              <p className="text-[11px] text-white/60 truncate">
                Instructor de {instrumentLabel(profile.instrument)}
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Desktop header */}
          <header className="hidden md:flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {getPageTitle()}
              </h1>
              <p className="text-muted-foreground text-sm">
                Instructor de {instrumentLabel(profile.instrument)}
              </p>
            </div>
          </header>

          {renderContent()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <InstructorMobileNav />
    </div>
  );
};

export default InstructorPanel;
