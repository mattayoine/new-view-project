
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SecurityContextType {
  userRole: string | null;
  isAdmin: boolean;
  isAdvisor: boolean;
  isFounder: boolean;
  canAccess: (resource: string, action: string) => boolean;
  loading: boolean;
  refreshRole: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    if (!user || !session) {
      console.log('No session, cannot fetch user role');
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching user role for:', user.email);
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } else {
        console.log('User role fetched:', data?.role);
        setUserRole(data?.role || null);
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshRole = async () => {
    setLoading(true);
    await fetchUserRole();
  };

  useEffect(() => {
    if (!authLoading && user && session) {
      fetchUserRole();
    } else if (!user || !session) {
      setUserRole(null);
      setLoading(false);
    }
  }, [user, session, authLoading]);

  const isAdmin = userRole === 'admin';
  const isAdvisor = userRole === 'advisor';
  const isFounder = userRole === 'founder';

  const canAccess = (resource: string, action: string): boolean => {
    if (!userRole) return false;

    // Admin can access everything
    if (isAdmin) return true;

    // Define access rules
    const accessRules: Record<string, Record<string, string[]>> = {
      applications: {
        view: ['admin'],
        update: ['admin'],
        create: ['admin', 'advisor', 'founder']
      },
      assignments: {
        view: ['admin', 'advisor', 'founder'],
        create: ['admin'],
        update: ['admin']
      },
      sessions: {
        view: ['admin', 'advisor', 'founder'],
        create: ['admin', 'advisor', 'founder'],
        update: ['admin', 'advisor', 'founder']
      },
      goals: {
        view: ['admin', 'advisor', 'founder'],
        create: ['admin', 'founder'],
        update: ['admin', 'founder']
      },
      messages: {
        view: ['admin', 'advisor', 'founder'],
        create: ['admin', 'advisor', 'founder'],
        update: ['admin', 'advisor', 'founder']
      }
    };

    const allowedRoles = accessRules[resource]?.[action] || [];
    return allowedRoles.includes(userRole);
  };

  return (
    <SecurityContext.Provider value={{
      userRole,
      isAdmin,
      isAdvisor,
      isFounder,
      canAccess,
      loading,
      refreshRole
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
