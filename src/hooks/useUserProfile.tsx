
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserProfileData {
  id: string;
  user_id: string;
  auth_id: string;
  profile_type: string;
  profile_data: any;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

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

      return data ? {
        ...data,
        is_profile_complete: data.is_profile_complete || false
      } as UserProfileData : null;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('No user logged in');

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
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    },
  });

  const updateProfileData = useMutation({
    mutationFn: async (updates: Partial<UserProfileData>) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          auth_id: user.id,
          user_id: userProfile?.id,
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;
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

  return {
    userProfile,
    profileData,
    isLoading,
    updateProfile,
    updateProfileData,
  };
};
