
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useSecurity } from './useSecurityContext';
import { useAuth } from './useAuth';

interface SecureQueryOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  requiredRole?: 'admin' | 'advisor' | 'founder';
  resource?: string;
  action?: string;
  enabled?: boolean;
}

export const useSecureQuery = <T,>({
  queryKey,
  queryFn,
  requiredRole,
  resource,
  action,
  enabled: userEnabled = true,
  ...options
}: SecureQueryOptions<T> & Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn' | 'enabled'>) => {
  const { user, session } = useAuth();
  const { userRole, canAccess, loading: securityLoading } = useSecurity();

  // Check if user has required permissions
  const hasPermission = () => {
    if (!user || !session || !userRole) return false;
    
    if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
      return false;
    }
    
    if (resource && action && !canAccess(resource, action)) {
      return false;
    }
    
    return true;
  };

  const enabled = userEnabled && !securityLoading && hasPermission();

  return useQuery({
    queryKey,
    queryFn,
    enabled,
    ...options
  });
};
