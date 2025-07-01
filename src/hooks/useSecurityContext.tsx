
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SecurityContextType {
  userRole: string | null;
  loading: boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { user, session } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !session) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(data?.role || null);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, session]);

  const canAccess = (resource: string, action: string): boolean => {
    if (!userRole) return false;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Basic resource-based access control
    // This can be extended with more sophisticated permissions
    const permissions: Record<string, string[]> = {
      advisor: ['sessions', 'messages', 'goals', 'resources'],
      founder: ['sessions', 'messages', 'goals'],
    };
    
    const userPermissions = permissions[userRole] || [];
    return userPermissions.includes(resource);
  };

  const value = {
    userRole,
    loading,
    canAccess
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
