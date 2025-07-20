
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SecurityProvider } from "@/hooks/useSecurityContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";

// Import enhanced dashboards
import EnhancedFounderDashboard from "./pages/EnhancedFounderDashboard";
import EnhancedAdvisorDashboard from "./pages/EnhancedAdvisorDashboard";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import FounderSessionHub from "./pages/FounderSessionHub";
import AdvisorSessionHub from "./pages/AdvisorSessionHub";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SecurityProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Enhanced Dashboards */}
                <Route path="/founder-dashboard" element={<EnhancedFounderDashboard />} />
                <Route path="/advisor-dashboard" element={<EnhancedAdvisorDashboard />} />
                
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/founder-session-hub" element={<FounderSessionHub />} />
                <Route path="/advisor-session-hub" element={<AdvisorSessionHub />} />
              </Routes>
            </BrowserRouter>
          </SecurityProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
