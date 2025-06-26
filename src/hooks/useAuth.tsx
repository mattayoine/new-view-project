import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserRecord = async (authUser: User) => {
    try {
      console.log('Checking/creating user record for:', authUser.email);
      
      // Use service role or a safer approach to check if user exists
      // First try to create the user record, if it fails due to conflict, that means it exists
      const userRole = authUser.user_metadata?.role || 'founder';
      
      console.log('Creating new user record with role:', userRole);
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          email: authUser.email!,
          role: userRole,
          status: userRole === 'admin' ? 'active' : 'pending_activation',
          profile_completed: userRole === 'admin'
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          // User already exists, that's fine
          console.log('User record already exists, fetching existing record');
          
          // Try to fetch the existing user record
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('role, status')
            .eq('auth_id', authUser.id)
            .maybeSingle();
            
          if (!fetchError && existingUser) {
            console.log('Found existing user record with role:', existingUser.role);
          }
        } else {
          console.error('Error creating user record:', insertError);
        }
      } else {
        console.log('Successfully created user record with role:', userRole);
      }
    } catch (error) {
      console.error('Error in createUserRecord:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await createUserRecord(session.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Create user record for new signins
        if (event === 'SIGNED_IN' && session?.user) {
          // Use a timeout to avoid race conditions with RLS
          setTimeout(async () => {
            if (mounted) {
              await createUserRecord(session.user);
            }
          }, 200);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        if (mounted) {
          console.log('Initial session:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Use timeout to avoid RLS issues during initial load
            setTimeout(async () => {
              if (mounted) {
                await createUserRecord(session.user);
              }
            }, 200);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Signing out user');
      
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      await supabase.auth.signOut();
      
      // Clear state
      setSession(null);
      setUser(null);
      
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force cleanup even if signOut fails
      setSession(null);
      setUser(null);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
