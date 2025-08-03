
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRealTimeDashboard = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userProfile) return;

    console.log('Setting up real-time dashboard subscriptions for user:', userProfile.id);

    // Listen for notification changes
    const notificationChannel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`
        },
        (payload) => {
          console.log('Notification change for user:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
          queryClient.invalidateQueries({ queryKey: ['optimized-dashboard-data'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    // Listen for goal changes
    const goalChannel = supabase
      .channel('user-goals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `founder_id=eq.${userProfile.id}`
        },
        (payload) => {
          console.log('Goal change for user:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }
      )
      .subscribe();

    // Listen for resource changes
    const resourceChannel = supabase
      .channel('user-resources')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources'
        },
        (payload) => {
          console.log('Resource change:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
          queryClient.invalidateQueries({ queryKey: ['resources'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up dashboard subscriptions');
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(goalChannel);
      supabase.removeChannel(resourceChannel);
    };
  }, [userProfile, queryClient]);

  return {
    isConnected: true
  };
};
