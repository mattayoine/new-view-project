
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  redirectTo = '/auth' 
}) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && userProfile.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  if (userProfile.status !== 'active') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Account Inactive</h2>
          <p className="text-muted-foreground">
            Your account is currently {userProfile.status}. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
