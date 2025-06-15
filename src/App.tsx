
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ApplySME from "./pages/ApplySME";
import ApplyCoPilot from "./pages/ApplyCoPilot";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import FounderDashboard from "./pages/FounderDashboard";
import AdvisorDashboard from "./pages/AdvisorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/apply-sme" element={<ApplySME />} />
          <Route path="/apply-copilot" element={<ApplyCoPilot />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/founder-dashboard" element={<FounderDashboard />} />
          <Route path="/advisor-dashboard" element={<AdvisorDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
