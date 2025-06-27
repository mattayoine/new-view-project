import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SecurityProvider } from "@/hooks/useSecurityContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Onboarding from "./pages/Onboarding";
import FounderApplication from "./pages/FounderApplication";
import AdvisorApplication from "./pages/AdvisorApplication";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PendingApproval from "./pages/PendingApproval";
import FounderDashboard from "./pages/FounderDashboard";
import AdvisorDashboard from "./pages/AdvisorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SecurityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Onboarding />} />
                <Route path="/founder-application" element={<FounderApplication />} />
                <Route path="/advisor-application" element={<AdvisorApplication />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/founder-dashboard" element={
                  <AuthGuard requiredRole="founder">
                    <FounderDashboard />
                  </AuthGuard>
                } />
                <Route path="/advisor-dashboard" element={
                  <AuthGuard requiredRole="advisor">
                    <AdvisorDashboard />
                  </AuthGuard>
                } />
                <Route path="/admin-dashboard" element={
                  <AuthGuard requiredRole="admin">
                    <AdminDashboard />
                  </AuthGuard>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SecurityProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
