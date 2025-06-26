
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

  // ADMIN BYPASS: Allow admins through regardless of profile completion
  if (requireAuth && user && userRole === 'admin') {
    console.log('AuthGuard: Admin user detected, allowing access');
    return <>{children}</>;
  }

  // For non-admin users, check if they have a proper role assignment
  if (requireAuth && user && !userRole) {
    console.log('AuthGuard: User exists but no role assigned, blocking access');
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};
