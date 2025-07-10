import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSecurity } from '@/hooks/useSecurityContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'advisor' | 'founder' | string[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requireAuth = true 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useSecurity();
  const location = useLocation();

  // Show loading while authentication is being determined
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific role is required
  if (requiredRole && user) {
    if (Array.isArray(requiredRole)) {
      // Multiple roles allowed
      if (!userRole || !requiredRole.includes(userRole)) {
        return <Navigate to="/" replace />;
      }
    } else {
      // Single role required
      if (userRole !== requiredRole) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};