
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { SecurityProvider } from './hooks/useSecurityContext';
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import FounderDashboard from './pages/FounderDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdvisorSessionHub from './pages/AdvisorSessionHub';
import PendingApproval from './pages/PendingApproval';
import ApplyCoPilot from './pages/ApplyCoPilot';
import ApplySME from './pages/ApplySME';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Router>
          <AuthProvider>
            <SecurityProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/apply-copilot" element={<ApplyCoPilot />} />
                <Route path="/apply-sme" element={<ApplySME />} />
                <Route path="/pending-approval" element={<PendingApproval />} />

                {/* Protected Routes */}
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/advisor-dashboard" element={
                  <ProtectedRoute requiredRole="advisor">
                    <AdvisorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/founder-dashboard" element={
                  <ProtectedRoute requiredRole="founder">
                    <FounderDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/advisor-hub" element={
                  <ProtectedRoute requiredRole="advisor">
                    <AdvisorSessionHub />
                  </ProtectedRoute>
                } />
              </Routes>
            </SecurityProvider>
          </AuthProvider>
        </Router>
      </div>
    </QueryClientProvider>
  );
}

export default App;
