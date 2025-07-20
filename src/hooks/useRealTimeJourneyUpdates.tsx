
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useRealTimeJourneyUpdates = () => {
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuth();

  const invalidateJourneyQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-journey-flow'] });
    queryClient.invalidateQueries({ queryKey: ['user-journey-status'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['session-flow'] });
  }, [queryClient]);

  useEffect(() => {
    if (!user || !userProfile) return;

    const channels: any[] = [];

    // Subscribe to application status changes
    const applicationChannel = supabase
      .channel(`applications-${user.email}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'base_applications',
          filter: `email=eq.${user.email}`
        },
        (payload) => {
          console.log('Application status updated:', payload);
          invalidateJourneyQueries();
          
          if (payload.new.status === 'approved') {
            toast.success('Your application has been approved! Welcome to the platform.');
          } else if (payload.new.status === 'rejected') {
            toast.error('Your application has been reviewed. Please check your email for details.');
          }
        }
      )
      .subscribe();

    channels.push(applicationChannel);

    // Subscribe to assignment changes
    const assignmentChannel = supabase
      .channel(`assignments-${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisor_founder_assignments',
          filter: `advisor_id=eq.${userProfile.id},founder_id=eq.${userProfile.id}`
        },
        (payload) => {
          console.log('Assignment updated:', payload);
          invalidateJourneyQueries();
          
          if (payload.eventType === 'INSERT') {
            toast.success('You have been matched! Check your dashboard for details.');
          }
        }
      )
      .subscribe();

    channels.push(assignmentChannel);

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel(`sessions-${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          console.log('Session updated:', payload);
          invalidateJourneyQueries();
          
          if (payload.eventType === 'INSERT') {
            toast.info('New session scheduled!');
          } else if (payload.new?.status === 'completed') {
            toast.success('Session completed successfully!');
          }
        }
      )
      .subscribe();

    channels.push(sessionChannel);

    // Subscribe to notifications
    const notificationChannel = supabase
      .channel(`notifications-${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`
        },
        (payload) => {
          console.log('New notification:', payload);
          const notification = payload.new;
          
          if (notification.priority === 'high' || notification.priority === 'urgent') {
            toast(notification.title, {
              description: notification.message,
              duration: 5000
            });
          }
          
          invalidateJourneyQueries();
        }
      )
      .subscribe();

    channels.push(notificationChannel);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, userProfile, invalidateJourneyQueries]);

  return {
    isConnected: true // Could be enhanced to track actual connection status
  };
};
