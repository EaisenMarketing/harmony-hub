import { Suspense, lazy, type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const Auth = lazy(() => import("./pages/Auth"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const CourseViewer = lazy(() => import("./pages/CourseViewer"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const InstructorPanel = lazy(() => import("./pages/InstructorPanel"));
const AdFlowDashboard = lazy(() => import("./pages/AdFlowDashboard"));
const TeacherApplicationPage = lazy(() => import("./pages/TeacherApplicationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthProvider = lazy(() => import("@/contexts/AuthContext").then(m => ({ default: m.AuthProvider })));
const DataProvider = lazy(() => import("@/components/app/DataProvider"));

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

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<WithAuth><Auth /></WithAuth>} />
        <Route path="/portal" element={<WithAuth><StudentPortal /></WithAuth>} />
        <Route path="/portal/curso/:courseId" element={<WithAuth><CourseViewer /></WithAuth>} />
        <Route path="/portal/curso/:courseId/leccion/:lessonId" element={<WithAuth><CourseViewer /></WithAuth>} />
        <Route path="/portal/*" element={<WithAuth><StudentPortal /></WithAuth>} />
        <Route path="/admin" element={<WithAuth><AdminPanel /></WithAuth>} />
        <Route path="/admin/*" element={<WithAuth><AdminPanel /></WithAuth>} />
        <Route path="/instructor" element={<WithAuth><InstructorPanel /></WithAuth>} />
        <Route path="/instructor/*" element={<WithAuth><InstructorPanel /></WithAuth>} />
        <Route path="/adflow" element={<WithAuth><AdFlowDashboard /></WithAuth>} />
        <Route path="/aplicar-maestro" element={<WithData><TeacherApplicationPage /></WithData>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
