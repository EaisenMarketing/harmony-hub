import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";

const Auth = lazy(() => import("./pages/Auth"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const CourseViewer = lazy(() => import("./pages/CourseViewer"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const InstructorPanel = lazy(() => import("./pages/InstructorPanel"));
const AdFlowDashboard = lazy(() => import("./pages/AdFlowDashboard"));
const TeacherApplicationPage = lazy(() => import("./pages/TeacherApplicationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen bg-[hsl(222,47%,5%)]" />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/portal" element={<StudentPortal />} />
              <Route path="/portal/curso/:courseId" element={<CourseViewer />} />
              <Route path="/portal/curso/:courseId/leccion/:lessonId" element={<CourseViewer />} />
              <Route path="/portal/*" element={<StudentPortal />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/*" element={<AdminPanel />} />
              <Route path="/instructor" element={<InstructorPanel />} />
              <Route path="/instructor/*" element={<InstructorPanel />} />
              <Route path="/adflow" element={<AdFlowDashboard />} />
              <Route path="/aplicar-maestro" element={<TeacherApplicationPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
