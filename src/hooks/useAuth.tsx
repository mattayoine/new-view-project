import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  role: string;
  status: string;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    loading: true,
    isAuthenticated: false,
  });

  const fetchUserProfile = async (user: User) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return userProfile as UserProfile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up any existing auth state first
      await supabase.auth.signOut({ scope: 'global' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await fetchUserProfile(data.user);
        setAuthState({
          user: data.user,
          userProfile: profile,
          loading: false,
          isAuthenticated: true,
        });
        
        toast.success('Signed in successfully');
        return { success: true, user: data.user, profile };
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // Clean up any existing auth state first
      await supabase.auth.signOut({ scope: 'global' });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) throw error;

      toast.success('Account created successfully. Please check your email for verification.');
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      setAuthState({
        user: null,
        userProfile: null,
        loading: false,
        isAuthenticated: false,
      });

      toast.success('Signed out successfully');
      
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ ...prev, loading: false }));
          return;
        }

        if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          setAuthState({
            user: session.user,
            userProfile: profile,
            loading: false,
            isAuthenticated: true,
          });
        } else {
          setAuthState({
            user: null,
            userProfile: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthState({
          user: null,
          userProfile: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          // Defer profile fetching to avoid potential deadlocks
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user);
            setAuthState({
              user: session.user,
              userProfile: profile,
              loading: false,
              isAuthenticated: true,
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            userProfile: null,
            loading: false,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user but keep existing profile if available
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            isAuthenticated: true,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshProfile: async () => {
      if (authState.user) {
        const profile = await fetchUserProfile(authState.user);
        setAuthState(prev => ({ ...prev, userProfile: profile }));
      }
    }
  };
};
