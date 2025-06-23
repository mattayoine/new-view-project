
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSecurity } from '@/hooks/useSecurityContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'founder' | 'advisor' | 'admin';
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}) => {
  const { user, session, loading: authLoading } = useAuth();
  const { userRole, loading: securityLoading } = useSecurity();

  if (authLoading || securityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
