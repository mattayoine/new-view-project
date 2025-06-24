
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

  // Show loading spinner while checking auth
  if (authLoading || securityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !session) {
    console.log('ProtectedRoute: No user/session, redirecting to login');
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    console.log('ProtectedRoute: Insufficient role, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Access granted for role:', userRole);
  return <>{children}</>;
};

export default ProtectedRoute;
