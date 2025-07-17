
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { userProfile, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect based on user role
  switch (userProfile.role) {
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    case 'advisor':
      return <Navigate to="/advisor-dashboard" replace />;
    case 'founder':
      return <Navigate to="/founder-dashboard" replace />;
    default:
      return <Navigate to="/onboarding" replace />;
  }
};

export default Dashboard;
