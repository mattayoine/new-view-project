
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
      
      // For the specific admin email, set role immediately to bypass any DB issues
      if (user.email === 'ainestuart58@gmail.com') {
        console.log('Admin email detected, setting admin role immediately');
        setUserRole('admin');
        setLoading(false);
        return;
      }
      
      // Use a more specific query to avoid RLS recursion issues
      const { data, error } = await supabase
        .from('users')
        .select('role, status')
        .eq('auth_id', user.id)
        .maybeSingle(); // Use maybeSingle to handle case where no record exists

      if (error) {
        console.error('Error fetching user role:', error);
        // For RLS recursion issues, try to handle gracefully
        if (error.code === '42P17' || error.message.includes('infinite recursion')) {
          console.log('RLS recursion detected, checking if this is admin email');
          if (user.email === 'ainestuart58@gmail.com') {
            console.log('Setting admin role for known admin email');
            setUserRole('admin');
          } else {
            console.log('Non-admin user, waiting for user creation...');
            setUserRole(null);
          }
        } else {
          setUserRole(null);
        }
      } else if (data) {
        console.log('User role fetched:', data.role, 'status:', data.status);
        setUserRole(data.role || null);
      } else {
        console.log('No user record found, may need to be created');
        // Special handling for admin email
        if (user.email === 'ainestuart58@gmail.com') {
          console.log('Admin email without record, setting admin role');
          setUserRole('admin');
        } else {
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      // Fallback for admin email
      if (user.email === 'ainestuart58@gmail.com') {
        console.log('Exception occurred, but setting admin role for known admin');
        setUserRole('admin');
      } else {
        setUserRole(null);
      }
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
      // Add a small delay to allow user record creation to complete
      const timer = setTimeout(() => {
        fetchUserRole();
      }, 100);
      return () => clearTimeout(timer);
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
