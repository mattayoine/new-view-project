
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSecurity } from '@/hooks/useSecurityContext';
import { LoadingState } from '@/components/ui/loading-state';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'founder' | 'advisor' | 'admin';
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  redirectTo = '/login'
}) => {
  const { user, session, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useSecurity();

  // Show loading while checking authentication
  if (authLoading || roleLoading) {
    return <LoadingState message="Verifying access..." />;
  }

  // Check if authentication is required
  if (requireAuth && (!user || !session)) {
    console.log('AuthGuard: No user/session, redirecting to login');
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access if required
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    console.log('AuthGuard: Insufficient role access, user has:', userRole, 'required:', requiredRole);
    return <Navigate to="/" replace />;
  }

  // Block access for users without proper roles (unapproved users)
  if (requireAuth && user && !userRole) {
    console.log('AuthGuard: User exists but no role assigned, blocking access');
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};
