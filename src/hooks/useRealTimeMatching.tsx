
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileUpdateMatching } from './useUnifiedMatching';
import { toast } from 'sonner';

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
        async (payload) => {
          console.log('Profile change detected:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const profileData = payload.new;
            if (profileData?.user_id && profileData?.profile_type) {
              try {
                // Trigger background match recalculation
                await profileUpdateMatching.mutateAsync({
                  userId: profileData.user_id,
                  profileType: profileData.profile_type
                });
                
                // Show user feedback
                toast.success('Profile updated - matches are being recalculated');
              } catch (error) {
                console.error('Error updating matches:', error);
                toast.error('Failed to update matches');
              }
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
          queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
          queryClient.invalidateQueries({ queryKey: ['assignments'] });
        }
      )
      .subscribe();

    // Listen for session changes to update metrics
    const sessionChannel = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          console.log('Session change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          queryClient.invalidateQueries({ queryKey: ['session-flow'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
          queryClient.invalidateQueries({ queryKey: ['session-analytics'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time matching subscriptions');
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(assignmentChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [profileUpdateMatching, queryClient]);

  return {
    triggerProfileUpdate: profileUpdateMatching.mutate,
    isUpdating: profileUpdateMatching.isPending
  };
};
