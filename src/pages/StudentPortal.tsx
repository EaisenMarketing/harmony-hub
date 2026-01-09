import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { DashboardStats } from '@/components/student/DashboardStats';
import { ActiveCourses } from '@/components/student/ActiveCourses';
import { ClassCalendar } from '@/components/student/ClassCalendar';
import { CertificatesSection } from '@/components/student/CertificatesSection';
import { 
  useStudentProfile, 
  useStudentCourses, 
  useUpcomingClasses, 
  useStudentStats 
} from '@/hooks/useStudentData';

const StudentPortal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const { data: profile } = useStudentProfile();
  const { data: courses = [], isLoading: coursesLoading } = useStudentCourses();
  const { data: classes = [], isLoading: classesLoading } = useUpcomingClasses();
  const { data: stats } = useStudentStats();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-8">
          {/* Welcome Header */}
          <header>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {greeting()}, {profile?.full_name?.split(' ')[0] || 'Estudiante'}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Continúa donde lo dejaste y alcanza tus metas musicales.
            </p>
          </header>

          {/* Stats */}
          <DashboardStats
            completedLessons={stats?.completedLessons || 0}
            totalHours={stats?.totalHours || 0}
            certificates={stats?.certificates || 0}
            streak={stats?.streak || 0}
          />

          {/* Active Courses */}
          <ActiveCourses courses={courses} isLoading={coursesLoading} />

          {/* Calendar & Upcoming Classes */}
          <ClassCalendar classes={classes} isLoading={classesLoading} />

          {/* Certificates */}
          <CertificatesSection />
        </div>
      </main>
    </div>
  );
};

export default StudentPortal;
