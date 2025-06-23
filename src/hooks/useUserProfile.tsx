
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { UserProfile, FounderProfileData, AdvisorProfileData } from '@/types/profile';

export const useUserProfile = (userId?: string) => {
  const { user } = useAuth();
  const actualUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-profile', actualUserId],
    queryFn: async () => {
      if (!actualUserId) throw new Error('User ID required');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', actualUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      
      return profile as UserProfile | null;
    },
    enabled: !!actualUserId
  });
};

export const useUserWithProfile = (userId?: string) => {
  const { user } = useAuth();
  const actualUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-with-profile', actualUserId],
    queryFn: async () => {
      if (!actualUserId) throw new Error('User ID required');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          profile:user_profiles(*)
        `)
        .eq('id', actualUserId)
        .single();

      if (userError) throw userError;
      
      return userData;
    },
    enabled: !!actualUserId
  });
};
