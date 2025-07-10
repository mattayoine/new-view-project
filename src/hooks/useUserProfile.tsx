
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserWithProfile {
  id: string;
  auth_id: string;
  email: string;
  role: string;
  status: string;
  profile_completed: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserProfileData {
  id: string;
  user_id: string;
  auth_id: string;
  profile_type: string;
  profile_data: any;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile data:', error);
        throw error;
      }

      return data as UserProfileData | null;
    },
    enabled: !!user?.id
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserWithProfile>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('auth_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-data'] });
      queryClient.invalidateQueries({ queryKey: ['user-with-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  const updateProfileData = useMutation({
    mutationFn: async (updates: { profile_data?: any; profile_type?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if profile exists
      if (profileData) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('auth_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            auth_id: user.id,
            user_id: userProfile?.id,
            profile_type: updates.profile_type || 'user',
            profile_data: updates.profile_data || {},
            is_profile_complete: true
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-data'] });
      toast.success('Profile data updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile data');
    }
  });

  return {
    userProfile: userProfile,
    profileData,
    isLoading: profileLoading,
    updateProfile,
    updateProfileData
  };
};
