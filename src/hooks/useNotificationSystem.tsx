
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateNotificationParams {
  userId: string;
  type: 'message' | 'session' | 'assignment' | 'escalation' | 'system';
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  sendEmail?: boolean;
}

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateNotificationParams) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          priority: params.priority || 'normal',
          metadata: params.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Send email for high priority or escalation notifications
      if (params.sendEmail || params.priority === 'urgent' || params.type === 'escalation') {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            notificationId: data.id,
            userId: params.userId,
            title: params.title,
            message: params.message,
            priority: params.priority,
            type: params.type
          }
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-notifications'] });
    }
  });
};

export const useBulkCreateNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notifications: CreateNotificationParams[]) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert(
          notifications.map(notif => ({
            user_id: notif.userId,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            priority: notif.priority || 'normal',
            metadata: notif.metadata || {}
          }))
        )
        .select();

      if (error) throw error;

      // Send emails for urgent notifications
      const urgentNotifications = notifications.filter(
        n => n.sendEmail || n.priority === 'urgent' || n.type === 'escalation'
      );

      if (urgentNotifications.length > 0) {
        await supabase.functions.invoke('send-bulk-notification-emails', {
          body: { notifications: urgentNotifications }
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-notifications'] });
    }
  });
};

// System-wide notification broadcasting
export const useBroadcastNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      message,
      priority = 'normal',
      userRole,
      sendEmail = false
    }: {
      title: string;
      message: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      userRole?: 'advisor' | 'founder' | 'admin';
      sendEmail?: boolean;
    }) => {
      // Get target users
      let query = supabase
        .from('users')
        .select('id, email')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (userRole) {
        query = query.eq('role', userRole);
      }

      const { data: users, error: usersError } = await query;
      if (usersError) throw usersError;

      if (!users || users.length === 0) return [];

      // Create notifications for all users
      const { data, error } = await supabase
        .from('notifications')
        .insert(
          users.map(user => ({
            user_id: user.id,
            type: 'system',
            title,
            message,
            priority,
            metadata: { broadcast: true, target_role: userRole }
          }))
        )
        .select();

      if (error) throw error;

      // Send emails if requested
      if (sendEmail) {
        await supabase.functions.invoke('send-broadcast-emails', {
          body: {
            title,
            message,
            priority,
            users: users.map(u => u.email)
          }
        });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-notifications'] });
      toast.success(`Broadcast sent to ${data?.length || 0} users`);
    }
  });
};

// Auto-notification hooks for specific events
export const useSessionNotifications = () => {
  const createNotification = useCreateNotification();

  return {
    notifySessionScheduled: (advisorId: string, founderId: string, sessionData: any) => {
      Promise.all([
        createNotification.mutateAsync({
          userId: advisorId,
          type: 'session',
          title: 'Session Scheduled',
          message: `New session scheduled: ${sessionData.title}`,
          priority: 'normal',
          metadata: { session_id: sessionData.id, type: 'scheduled' },
          sendEmail: true
        }),
        createNotification.mutateAsync({
          userId: founderId,
          type: 'session',
          title: 'Session Scheduled',
          message: `New session scheduled: ${sessionData.title}`,
          priority: 'normal',
          metadata: { session_id: sessionData.id, type: 'scheduled' },
          sendEmail: true
        })
      ]);
    },

    notifySessionReminder: (userId: string, sessionData: any) => {
      createNotification.mutateAsync({
        userId,
        type: 'session',
        title: 'Session Reminder',
        message: `Upcoming session: ${sessionData.title} in 24 hours`,
        priority: 'high',
        metadata: { session_id: sessionData.id, type: 'reminder' },
        sendEmail: true
      });
    },

    notifySessionCancelled: (userId: string, sessionData: any, reason?: string) => {
      createNotification.mutateAsync({
        userId,
        type: 'session',
        title: 'Session Cancelled',
        message: `Session cancelled: ${sessionData.title}${reason ? ` - ${reason}` : ''}`,
        priority: 'high',
        metadata: { session_id: sessionData.id, type: 'cancelled', reason },
        sendEmail: true
      });
    }
  };
};

export const useAssignmentNotifications = () => {
  const createNotification = useCreateNotification();

  return {
    notifyAssignmentCreated: (advisorId: string, founderId: string, assignmentData: any) => {
      Promise.all([
        createNotification.mutateAsync({
          userId: advisorId,
          type: 'assignment',
          title: 'New Assignment',
          message: 'You have been assigned to mentor a new founder',
          priority: 'high',
          metadata: { assignment_id: assignmentData.id, type: 'created' },
          sendEmail: true
        }),
        createNotification.mutateAsync({
          userId: founderId,
          type: 'assignment',
          title: 'Advisor Assigned',
          message: 'An advisor has been assigned to help you',
          priority: 'high',
          metadata: { assignment_id: assignmentData.id, type: 'created' },
          sendEmail: true
        })
      ]);
    },

    notifyAssignmentTerminated: (userId: string, assignmentData: any, reason?: string) => {
      createNotification.mutateAsync({
        userId,
        type: 'assignment',
        title: 'Assignment Terminated',
        message: `Assignment has been terminated${reason ? `: ${reason}` : ''}`,
        priority: 'urgent',
        metadata: { assignment_id: assignmentData.id, type: 'terminated', reason },
        sendEmail: true
      });
    }
  };
};
