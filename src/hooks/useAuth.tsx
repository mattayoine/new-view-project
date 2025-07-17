
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
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
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Signed in successfully');
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {},
          emailRedirectTo: `${window.location.origin}/`
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setAuthState({
        user: null,
        session: null,
        userProfile: null,
        loading: false,
        isAuthenticated: false,
      });

      toast.success('Signed out successfully');
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const resendVerification = async () => {
    try {
      if (!authState.user?.email) {
        throw new Error('No user email found');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: authState.user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user);
            setAuthState({
              user: session.user,
              session: session,
              userProfile: profile,
              loading: false,
              isAuthenticated: true,
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            userProfile: null,
            loading: false,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session: session,
            isAuthenticated: true,
          }));
        }
      }
    );

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
            session: session,
            userProfile: profile,
            loading: false,
            isAuthenticated: true,
          });
        } else {
          setAuthState({
            user: null,
            session: null,
            userProfile: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthState({
          user: null,
          session: null,
          userProfile: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resendVerification,
    refreshProfile: async () => {
      if (authState.user) {
        const profile = await fetchUserProfile(authState.user);
        setAuthState(prev => ({ ...prev, userProfile: profile }));
      }
    }
  };
};
