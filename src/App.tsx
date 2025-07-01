
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import FounderDashboard from './pages/FounderDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdvisorSessionHub from './pages/AdvisorSessionHub';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Login />
            </ProtectedRoute>
          } />
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
      </Router>
    </div>
  );
}

export default App;
