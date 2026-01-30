import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentPortal from "./pages/StudentPortal";
import CourseViewer from "./pages/CourseViewer";
import AdminPanel from "./pages/AdminPanel";
import InstructorPanel from "./pages/InstructorPanel";
import AdFlowDashboard from "./pages/AdFlowDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
