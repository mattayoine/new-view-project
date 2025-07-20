import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";

// Import enhanced dashboards
import EnhancedFounderDashboard from "./pages/EnhancedFounderDashboard";
import EnhancedAdvisorDashboard from "./pages/EnhancedAdvisorDashboard";
import ApplyAdvisor from "./pages/ApplyAdvisor";
import ApplyFounder from "./pages/ApplyFounder";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import FounderSessionHub from "./pages/FounderSessionHub";
import AdvisorSessionHub from "./pages/AdvisorSessionHub";
import Resources from "./pages/Resources";
import SessionDetails from "./pages/SessionDetails";
import AdminSessionTracker from "./pages/AdminSessionTracker";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminResourceManagement from "./pages/AdminResourceManagement";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSystemMonitor from "./pages/AdminSystemMonitor";
import AdminE2ETesting from "./pages/AdminE2ETesting";
import AdminDeploymentChecker from "./pages/AdminDeploymentChecker";
import AdminJourneyManagement from "./pages/AdminJourneyManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Enhanced Dashboards */}
              <Route path="/founder-dashboard" element={<EnhancedFounderDashboard />} />
              <Route path="/advisor-dashboard" element={<EnhancedAdvisorDashboard />} />
              
              <Route path="/apply-advisor" element={<ApplyAdvisor />} />
              <Route path="/apply-founder" element={<ApplyFounder />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/founder-session-hub" element={<FounderSessionHub />} />
              <Route path="/advisor-session-hub" element={<AdvisorSessionHub />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/session/:sessionId" element={<SessionDetails />} />

              {/* Admin Routes */}
              <Route path="/admin-session-tracker" element={<AdminSessionTracker />} />
              <Route path="/admin-user-management" element={<AdminUserManagement />} />
              <Route path="/admin-resource-management" element={<AdminResourceManagement />} />
              <Route path="/admin-notifications" element={<AdminNotifications />} />
              <Route path="/admin-system-monitor" element={<AdminSystemMonitor />} />
              <Route path="/admin-e2e-testing" element={<AdminE2ETesting />} />
              <Route path="/admin-deployment-checker" element={<AdminDeploymentChecker />} />
              <Route path="/admin-journey-management" element={<AdminJourneyManagement />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
