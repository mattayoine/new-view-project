
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { UserProfile, FounderProfileData, AdvisorProfileData, ProfileData } from '@/types/profile';

export const useUserProfile = (userId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-profile', userId || user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const targetUserId = userId || user.id;
      
      // First get the user's internal ID from auth_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', targetUserId)
        .single();

      if (userError) throw userError;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      
      if (!profile) return null;

      // Cast the profile_data from Json to our typed ProfileData
      return {
        ...profile,
        profile_data: profile.profile_data as unknown as ProfileData
      } as UserProfile;
    },
    enabled: !!user
  });
};

export const useUserWithProfile = (userId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-with-profile', userId || user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const targetUserId = userId || user.id;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          profile:user_profiles(*)
        `)
        .eq('auth_id', targetUserId)
        .single();

      if (userError) throw userError;
      
      if (!userData) return null;

      // Cast the profile_data if profile exists - handle single profile object
      if (userData.profile) {
        const profileData = Array.isArray(userData.profile) ? userData.profile[0] : userData.profile;
        if (profileData) {
          userData.profile = {
            ...profileData,
            profile_data: profileData.profile_data as unknown as ProfileData
          };
        }
      }
      
      return userData;
    },
    enabled: !!user
  });
};
