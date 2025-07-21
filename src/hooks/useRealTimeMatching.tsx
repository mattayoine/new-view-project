
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileUpdateMatching } from './useUnifiedMatching';

export const useRealTimeMatching = () => {
  const queryClient = useQueryClient();
  const profileUpdateMatching = useProfileUpdateMatching();

  useEffect(() => {
    console.log('Setting up real-time matching subscriptions...');

    // Listen for user_profiles changes
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const profileData = payload.new;
            if (profileData?.user_id && profileData?.profile_type) {
              // Trigger background match recalculation
              profileUpdateMatching.mutate({
                userId: profileData.user_id,
                profileType: profileData.profile_type
              });
            }
          }
        }
      )
      .subscribe();

    // Listen for assignment changes to invalidate caches
    const assignmentChannel = supabase
      .channel('assignment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisor_founder_assignments'
        },
        (payload) => {
          console.log('Assignment change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['founder-matches'] });
          queryClient.invalidateQueries({ queryKey: ['matching-stats'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time matching subscriptions');
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(assignmentChannel);
    };
  }, [profileUpdateMatching, queryClient]);

  return {
    // Expose methods for manual triggering if needed
    triggerProfileUpdate: profileUpdateMatching.mutate,
    isUpdating: profileUpdateMatching.isPending
  };
};
