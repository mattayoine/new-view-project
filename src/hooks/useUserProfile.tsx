
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { UserProfileData, ProfileData } from '@/types/profile';

export const useUserProfile = () => {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async (): Promise<UserProfileData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile data:', error);
        return null;
      }

      if (!data) return null;

      // Safely transform the data with proper type casting
      // Calculate is_profile_complete based on profile_data content
      const profileDataObj = data.profile_data as unknown as ProfileData;
      const isComplete = Boolean(profileDataObj && 
        Object.keys(profileDataObj).length > 0 &&
        'name' in profileDataObj &&
        profileDataObj.name);

      return {
        id: data.id,
        user_id: data.user_id,
        auth_id: data.auth_id,
        profile_type: data.profile_type as 'founder' | 'advisor',
        profile_data: profileDataObj,
        created_at: data.created_at,
        updated_at: data.updated_at,
        deleted_at: data.deleted_at,
        is_profile_complete: isComplete
      };
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: { profile_completed: boolean }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('users')
        .update({
          profile_completed: updates.profile_completed,
          updated_at: new Date().toISOString()
        })
        .eq('auth_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    },
  });

  const updateProfileData = useMutation({
    mutationFn: async (updates: Partial<Omit<UserProfileData, 'id' | 'created_at' | 'updated_at'>>) => {
      if (!user) throw new Error('No user logged in');

      const profileDataToUpsert = {
        auth_id: user.id,
        user_id: userProfile?.id || '',
        profile_type: updates.profile_type || 'founder',
        profile_data: updates.profile_data || {},
        is_profile_complete: updates.is_profile_complete || false,
        ...updates,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileDataToUpsert)
        .select()
        .single();

      if (error) throw error;
      
      // Also update the main users table with consistent property name
      await supabase
        .from('users')
        .update({ profile_completed: updates.is_profile_complete || false })
        .eq('auth_id', user.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile data updated successfully');
    },
    onError: (error: any) => {
      console.error('Profile data update error:', error);
      toast.error('Failed to update profile data');
    },
  });

  // Check if profile is complete based on profile_data
  const isProfileComplete = profileData?.profile_data && 
    Object.keys(profileData.profile_data).length > 0 &&
    'name' in profileData.profile_data &&
    profileData.profile_data.name;

  return {
    userProfile,
    profileData: profileData ? {
      ...profileData,
      is_profile_complete: isProfileComplete,
    } : null,
    isLoading,
    updateProfile,
    updateProfileData,
  };
};
