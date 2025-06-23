
import React from 'react';
import { useSecurity } from '@/hooks/useSecurityContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecureComponentProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'advisor' | 'founder';
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export const SecureComponent: React.FC<SecureComponentProps> = ({
  children,
  requiredRole,
  resource,
  action,
  fallback
}) => {
  const { userRole, canAccess, loading } = useSecurity();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return fallback || (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h3>
          <p className="text-yellow-700">
            You need {requiredRole} permissions to access this content.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check resource-based access
  if (resource && action && !canAccess(resource, action)) {
    return fallback || (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Insufficient Permissions</h3>
          <p className="text-red-700">
            You don't have permission to {action} {resource}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
