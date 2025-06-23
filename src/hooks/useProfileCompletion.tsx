
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileStatus, isLoading } = useQuery({
    queryKey: ['profile-completion', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: userData, error } = await supabase
        .from('users')
        .select('profile_completed')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return userData;
    },
    enabled: !!user?.id
  });

  const updateProfileCompletion = useMutation({
    mutationFn: async (completed: boolean) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('users')
        .update({ profile_completed: completed })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-completion', user?.id] });
    }
  });

  return {
    profileCompleted: profileStatus?.profile_completed ?? false,
    isLoading,
    updateProfileCompletion
  };
};
