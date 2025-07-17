
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import FounderDashboard from "./pages/FounderDashboard";
import AdvisorDashboard from "./pages/AdvisorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FounderApplication from "./pages/FounderApplication";
import AdvisorApplication from "./pages/AdvisorApplication";
import Onboarding from "./pages/Onboarding";
import PendingVerification from "./pages/PendingVerification";
import PendingApproval from "./pages/PendingApproval";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AdvisorSessionHub from "./pages/AdvisorSessionHub";
import FounderSessionHub from "./pages/FounderSessionHub";
import ResourceCenter from "./pages/ResourceCenter";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./components/auth/AuthProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/founder-dashboard" element={<FounderDashboard />} />
                <Route path="/advisor-dashboard" element={<AdvisorDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/apply-founder" element={<FounderApplication />} />
                <Route path="/apply-advisor" element={<AdvisorApplication />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/pending-verification" element={<PendingVerification />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/advisor-session-hub" element={<AdvisorSessionHub />} />
                <Route path="/founder-session-hub" element={<FounderSessionHub />} />
                <Route path="/resource-center" element={<ResourceCenter />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
