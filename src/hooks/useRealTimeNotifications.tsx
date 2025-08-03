
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useRealTimeNotifications = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userProfile) return;

    console.log('Setting up real-time notifications for user:', userProfile.id);

    // Initial unread count
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false)
        .is('deleted_at', null);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Listen for new notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          const notification = payload.new;
          
          // Show toast notification
          if (notification.priority === 'high') {
            toast.success(notification.title, {
              description: notification.message,
              action: notification.action_url ? {
                label: 'View',
                onClick: () => window.location.href = notification.action_url
              } : undefined
            });
          } else {
            toast(notification.title, {
              description: notification.message
            });
          }

          // Update unread count
          setUnreadCount(prev => prev + 1);
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          
          // If notification was marked as read
          if (payload.old.is_read === false && payload.new.is_read === true) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile, queryClient]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', userProfile?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userProfile?.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
