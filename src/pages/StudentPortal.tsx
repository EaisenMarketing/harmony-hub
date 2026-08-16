import { useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import logo from '@/assets/logo.webp';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { DashboardStats } from '@/components/student/DashboardStats';
import { ActiveCourses } from '@/components/student/ActiveCourses';
import { ClassCalendar } from '@/components/student/ClassCalendar';
import { CertificatesSection } from '@/components/student/CertificatesSection';
import { CoursesSection } from '@/components/student/CoursesSection';
import { CalendarSection } from '@/components/student/CalendarSection';
import { CertificatesPage } from '@/components/student/CertificatesPage';
import { MembershipSection } from '@/components/student/MembershipSection';
import { SettingsSection } from '@/components/student/SettingsSection';
import { ProductionDashboard } from '@/components/student/ProductionDashboard';
import { ProgressPanel } from '@/components/student/ProgressPanel';
import { ContinueWatchingButton } from '@/components/student/ContinueWatchingButton';
import { PracticeSection } from '@/components/student/PracticeSection';
import { TeacherConsultSection } from '@/components/student/TeacherConsultSection';
import { CommunitySection } from '@/components/student/CommunitySection';
import { ChordGeneratorModal } from '@/components/student/ChordGeneratorModal';
import { MusicTheoryAssistant } from '@/components/student/MusicTheoryAssistant';
import { PracticeCoachModal } from '@/components/student/PracticeCoachModal';
import { EarTrainerModal } from '@/components/student/EarTrainerModal';
import { PracticeFeedbackModal } from '@/components/student/PracticeFeedbackModal';
import { SongAnalyzerModal } from '@/components/student/SongAnalyzerModal';
import { SongLibraryModal } from '@/components/student/SongLibraryModal';
import { MetronomeTunerModal } from '@/components/student/MetronomeTunerModal';
import { ChordPhotoDetector } from '@/components/student/ChordPhotoDetector';
import { ChordCreatorModal } from '@/components/student/ChordCreatorModal';
import { SelectInstrumentGate } from '@/components/student/SelectInstrumentGate';
import { AIToolGate } from '@/components/student/AIToolGate';
import { TrialBanner } from '@/components/student/TrialBanner';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { useIsAdmin } from '@/hooks/useAdminData';
import { AI_TOOL_INSTRUMENTS, INSTRUMENT_PLAN_MAP } from '@/lib/instrument-access';
import {
  useStudentProfile,
  useStudentCourses,
  useUpcomingClasses,
  useStudentStats
} from '@/hooks/useStudentData';
import { useUserPlan } from '@/hooks/useCourseViewer';
import { MobileBottomNav } from '@/components/student/MobileBottomNav';

const StudentPortal = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile } = useStudentProfile();
  const { data: courses = [], isLoading: coursesLoading } = useStudentCourses();
  const { data: classes = [], isLoading: classesLoading } = useUpcomingClasses();
  const { data: stats } = useStudentStats();
  const { data: userPlan = 'basic' } = useUserPlan();
  const { data: userIns, isLoading: insLoading } = useUserInstrument();
  const { data: isAdmin } = useIsAdmin();
  const primaryInstrument = userIns?.instrument ?? null;
  const needsInstrument = !!user && !insLoading && !primaryInstrument && !isAdmin;
  const instrumentLabel = primaryInstrument
    ? INSTRUMENT_PLAN_MAP[primaryInstrument]?.label
    : null;


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

  const currentPath = location.pathname;

  const renderContent = () => {
    switch (currentPath) {
      case '/portal/cursos':
        return <CoursesSection />;
      case '/portal/practica':
        return <PracticeSection />;
      case '/portal/partituras':
        return <ScoresSection />;
      case '/portal/consultas':
        return <TeacherConsultSection />;
      case '/portal/comunidad':
        return <CommunitySection />;
      case '/portal/calendario':
        return <CalendarSection />;
      case '/portal/certificados':
        return <CertificatesPage />;
      case '/portal/pagos':
        return <MembershipSection />;
      case '/portal/configuracion':
        return <SettingsSection />;
      case '/portal/produccion':
        if (primaryInstrument && primaryInstrument !== 'production') {
          return <Navigate to="/portal" replace />;
        }
        return <ProductionDashboard />;
      case '/portal/progreso':
        return <ProgressPanel />;
      default:
        // Dashboard
        return (
          <>
            {/* Welcome Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {greeting()}, {profile?.full_name?.split(' ')[0] || 'Estudiante'}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                  {instrumentLabel
                    ? `Tu plan: ${instrumentLabel}. Sigue avanzando con tu instrumento.`
                    : 'Continúa donde lo dejaste y alcanza tus metas musicales.'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <span className="hidden md:inline-flex">
                  <NotificationBell />
                </span>
                <MetronomeTunerModal />
                <AIToolGate
                  toolKey="theory_assistant"
                  toolName="Asistente de teoría musical"
                  buttonLabel="Teoría"
                >
                  <MusicTheoryAssistant userPlan={userPlan} />
                </AIToolGate>
                <AIToolGate
                  toolKey="chord_generator"
                  toolName="Generador de acordes"
                  allowedInstruments={AI_TOOL_INSTRUMENTS.chord_generator}
                  buttonLabel="Acordes"
                >
                  <ChordGeneratorModal userPlan={userPlan} />
                </AIToolGate>
                <AIToolGate
                  toolKey="chord_photo"
                  toolName="Detector de acordes por foto"
                  allowedInstruments={AI_TOOL_INSTRUMENTS.chord_photo}
                  buttonLabel="Foto acordes"
                >
                  <ChordPhotoDetector userPlan={userPlan} />
                </AIToolGate>
                {['guitar', 'electric_guitar', 'bass'].includes(userIns?.instrument || '') && (
                  <ChordCreatorModal userInstrument={userIns?.instrument} />
                )}
                <AIToolGate toolKey="practice_coach" toolName="Coach de práctica IA" buttonLabel="Coach IA">
                  <PracticeCoachModal />
                </AIToolGate>
                <AIToolGate toolKey="ear_trainer" toolName="Entrenador de oído IA" buttonLabel="Oído IA">
                  <EarTrainerModal />
                </AIToolGate>
                <AIToolGate toolKey="practice_feedback" toolName="Feedback de práctica IA" buttonLabel="Feedback IA">
                  <PracticeFeedbackModal />
                </AIToolGate>
                <AIToolGate toolKey="song_analyzer" toolName="Analizador de canciones IA" buttonLabel="Canciones">
                  <SongAnalyzerModal userPlan={userPlan} />
                </AIToolGate>
                <SongLibraryModal userPlan={userPlan} />
              </div>
            </header>

            <TrialBanner />



            {/* Continuar donde lo dejé */}
            <ContinueWatchingButton />

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
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />
      
      <main className="flex-1 overflow-y-auto">
        {/* Mobile top header with logout */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 pt-12 pb-3 bg-background/95 backdrop-blur-sm border-b border-border md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <img loading="lazy" decoding="async" src={logo} alt="Acorde Live" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-foreground">Acorde Live</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell className="text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-2"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
          {renderContent()}
        </div>
      </main>

      <MobileBottomNav />
      <SelectInstrumentGate open={needsInstrument} />
    </div>
  );
};

export default StudentPortal;
