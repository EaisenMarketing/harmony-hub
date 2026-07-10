import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));

const Auth = lazy(() => import("./pages/Auth"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const CourseViewer = lazy(() => import("./pages/CourseViewer"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const InstructorPanel = lazy(() => import("./pages/InstructorPanel"));
const AdFlowDashboard = lazy(() => import("./pages/AdFlowDashboard"));
const TeacherApplicationPage = lazy(() => import("./pages/TeacherApplicationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthProvider = lazy(() => import("@/contexts/AuthContext").then(m => ({ default: m.AuthProvider })));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen bg-[hsl(222,47%,5%)]" />
);

const WithAuth = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Suspense fallback={null}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </Suspense>
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
          <Route path="/aplicar-maestro" element={<TeacherApplicationPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
