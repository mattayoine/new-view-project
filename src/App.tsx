import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import FounderDashboard from './pages/FounderDashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import FounderDirectory from './pages/FounderDirectory';
import AdvisorDirectory from './pages/AdvisorDirectory';
import AssignmentManagement from './pages/AssignmentManagement';
import SessionManagement from './pages/SessionManagement';
import Messaging from './pages/Messaging';
import SessionOverviewDashboard from './components/admin/SessionOverviewDashboard';
import AdvisorSessionHub from './pages/AdvisorSessionHub';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
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
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/founders" element={
            <ProtectedRoute requiredRole="admin">
              <FounderDirectory />
            </ProtectedRoute>
          } />
          <Route path="/advisors" element={
            <ProtectedRoute requiredRole="admin">
              <AdvisorDirectory />
            </ProtectedRoute>
          } />
          <Route path="/assignments" element={
            <ProtectedRoute requiredRole="admin">
              <AssignmentManagement />
            </ProtectedRoute>
          } />
          <Route path="/sessions" element={
            <ProtectedRoute>
              <SessionManagement />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <Messaging />
            </ProtectedRoute>
          } />
          <Route path="/session-monitor" element={
            <ProtectedRoute requiredRole="admin">
              <SessionOverviewDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/advisor-hub" element={
            <ProtectedRoute>
              <AdvisorSessionHub />
            </ProtectedRoute>
          } />
          
        </Routes>
      </Router>
    </div>
  );
}

export default App;
