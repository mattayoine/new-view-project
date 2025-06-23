
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { UserProfile, FounderProfileData, AdvisorProfileData, ProfileData } from '@/types/profile';

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
      
      if (!profile) return null;

      // Cast the profile_data from Json to our typed ProfileData
      return {
        ...profile,
        profile_data: profile.profile_data as unknown as ProfileData
      } as UserProfile;
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
      
      if (!userData) return null;

      // Cast the profile_data if profile exists
      if (userData.profile) {
        userData.profile = {
          ...userData.profile,
          profile_data: userData.profile.profile_data as unknown as ProfileData
        };
      }
      
      return userData;
    },
    enabled: !!actualUserId
  });
};
