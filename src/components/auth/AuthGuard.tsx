
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

  // Show loading while checking authentication and role
  if (authLoading || roleLoading) {
    return <LoadingState message="Verifying access..." />;
  }

  // Check if authentication is required
  if (requireAuth && (!user || !session)) {
    console.log('AuthGuard: No user/session, redirecting to login');
    return <Navigate to={redirectTo} replace />;
  }

  // ADMIN BYPASS: Allow admins through regardless of profile completion or other role requirements
  if (requireAuth && user && userRole === 'admin') {
    console.log('AuthGuard: Admin user detected, allowing access');
    return <>{children}</>;
  }

  // Check role-based access if required (non-admin users)
  if (requiredRole && userRole !== requiredRole) {
    console.log('AuthGuard: Insufficient role access, user has:', userRole, 'required:', requiredRole);
    return <Navigate to="/" replace />;
  }

  // For non-admin users, check if they have a proper role assignment
  // Give a bit more grace period for role loading for new users
  if (requireAuth && user && !userRole) {
    console.log('AuthGuard: User exists but no role assigned, checking if admin bypass applies');
    
    // If we're still loading or it's been a very short time since login, show loading
    // This prevents premature redirects for users whose records are still being created
    if (roleLoading) {
      return <LoadingState message="Setting up your account..." />;
    }
    
    console.log('AuthGuard: No role found after loading, redirecting to pending approval');
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};
