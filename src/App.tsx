import React, { Suspense, lazy, type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const CourseViewer = lazy(() => import("./pages/CourseViewer"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const InstructorPanel = lazy(() => import("./pages/InstructorPanel"));
const AdFlowDashboard = lazy(() => import("./pages/AdFlowDashboard"));
const TeacherApplicationPage = lazy(() => import("./pages/TeacherApplicationPage"));
const MyStudioPage = lazy(() => import("./pages/MyStudioPage"));
const StudioPanel = lazy(() => import("./pages/StudioPanel"));
const StudioInvitePage = lazy(() => import("./pages/public/StudioInvitePage"));
const StudioPlansPage = lazy(() => import("./pages/public/StudioPlansPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthProvider = lazy(() => import("@/contexts/AuthContext").then(m => ({ default: m.AuthProvider })));
const DataProvider = lazy(() => import("@/components/app/DataProvider"));

// Public pages
const CoursesPage = lazy(() => import("./pages/public/CoursesPage"));
const CourseDetailPage = lazy(() => import("./pages/public/CourseDetailPage"));
const LiveClassesPublicPage = lazy(() => import("./pages/public/LiveClassesPublicPage"));
const PricingPage = lazy(() => import("./pages/public/PricingPage"));
const TeachersPage = lazy(() => import("./pages/public/TeachersPage"));
const ContactPage = lazy(() => import("./pages/public/ContactPage"));
const SupportPage = lazy(() => import("./pages/public/SupportPage"));
const FreeMaterialPage = lazy(() => import("./pages/public/FreeMaterialPage"));
// (StaticPages se carga vía helper S abajo)

const PageFallback = () => (
  <div className="min-h-screen bg-[hsl(222,47%,5%)]" />
);

const WithAuth = ({ children }: { children: ReactNode }) => (
  <DataProvider>
    <AuthProvider>{children}</AuthProvider>
  </DataProvider>
);

const WithData = ({ children }: { children: ReactNode }) => (
  <DataProvider>{children}</DataProvider>
);

// Wrapper para exportaciones nombradas del módulo StaticPages
const S = (name: 'AboutPage'|'FaqPage'|'TermsPage'|'PrivacyPage'|'CancelPolicyPage'|'LoginAlias'|'RegisterAlias'|'RecoverAlias'|'TeacherAlias') => {
  const Cmp = lazy(async () => {
    const mod = await import("./pages/public/StaticPages");
    return { default: (mod as Record<string, React.ComponentType>)[name] };
  });
  return <Cmp />;
};

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />

        {/* Rutas públicas nuevas */}
        <Route path="/cursos" element={<CoursesPage />} />
        <Route path="/cursos/:slug" element={<CourseDetailPage />} />
        <Route path="/clases-en-vivo" element={<LiveClassesPublicPage />} />
        <Route path="/precios" element={<PricingPage />} />
        <Route path="/maestros" element={<TeachersPage />} />
        <Route path="/maestros/planes" element={<StudioPlansPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/soporte" element={<WithAuth><SupportPage /></WithAuth>} />
        <Route path="/nosotros" element={S('AboutPage')} />
        <Route path="/preguntas-frecuentes" element={S('FaqPage')} />
        <Route path="/terminos" element={S('TermsPage')} />
        <Route path="/privacidad" element={S('PrivacyPage')} />
        <Route path="/politica-de-cancelacion" element={S('CancelPolicyPage')} />
        <Route path="/material-gratis" element={<FreeMaterialPage />} />
        <Route path="/material-gratis/:slug" element={<FreeMaterialPage />} />

        {/* Alias */}
        <Route path="/login" element={S('LoginAlias')} />
        <Route path="/registro" element={S('RegisterAlias')} />
        <Route path="/recuperar-password" element={S('RecoverAlias')} />
        <Route path="/ser-maestro" element={S('TeacherAlias')} />

        {/* Rutas privadas existentes */}
        <Route path="/auth" element={<WithAuth><Auth /></WithAuth>} />
        <Route path="/reset-password" element={<WithAuth><ResetPassword /></WithAuth>} />
        <Route path="/portal" element={<WithAuth><StudentPortal /></WithAuth>} />
        <Route path="/portal/curso/:courseId" element={<WithAuth><CourseViewer /></WithAuth>} />
        <Route path="/portal/curso/:courseId/leccion/:lessonId" element={<WithAuth><CourseViewer /></WithAuth>} />
        <Route path="/portal/*" element={<WithAuth><StudentPortal /></WithAuth>} />
        <Route path="/admin" element={<WithAuth><AdminPanel /></WithAuth>} />
        <Route path="/admin/*" element={<WithAuth><AdminPanel /></WithAuth>} />
        <Route path="/instructor" element={<WithAuth><InstructorPanel /></WithAuth>} />
        <Route path="/instructor/*" element={<WithAuth><InstructorPanel /></WithAuth>} />
        <Route path="/estudio" element={<WithAuth><StudioPanel /></WithAuth>} />
        <Route path="/estudio/*" element={<WithAuth><StudioPanel /></WithAuth>} />
        <Route path="/mi-estudio" element={<WithAuth><MyStudioPage /></WithAuth>} />
        <Route path="/invitacion/:code" element={<WithAuth><StudioInvitePage /></WithAuth>} />
        <Route path="/adflow" element={<WithAuth><AdFlowDashboard /></WithAuth>} />
        <Route path="/aplicar-maestro" element={<WithData><TeacherApplicationPage /></WithData>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;

