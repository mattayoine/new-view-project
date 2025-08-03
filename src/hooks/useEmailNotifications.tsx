
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailNotificationData {
  userId: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  type?: string;
  notificationId?: string;
}

export const useSendEmailNotification = () => {
  return useMutation({
    mutationFn: async (data: EmailNotificationData) => {
      console.log('Sending email notification:', data);

      const { data: result, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          priority: data.priority || 'normal',
          type: data.type || 'system',
          notificationId: data.notificationId
        }
      });

      if (error) {
        console.error('Email notification error:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('Email notification sent successfully:', data);
      if (!data.skipped) {
        toast.success('Email notification sent');
      }
    },
    onError: (error: any) => {
      console.error('Failed to send email notification:', error);
      toast.error(`Failed to send email: ${error.message}`);
    }
  });
};

export const useAutomatedEmailWorkflows = () => {
  const sendEmailNotification = useSendEmailNotification();

  const sendWelcomeEmail = async (userId: string, userName: string) => {
    return sendEmailNotification.mutateAsync({
      userId,
      title: 'Welcome to Tseer!',
      message: `Welcome ${userName}! Your account has been set up successfully. You can now access all platform features and start your journey.`,
      type: 'welcome',
      priority: 'normal'
    });
  };

  const sendAssignmentNotification = async (userId: string, advisorName: string, founderName: string) => {
    return sendEmailNotification.mutateAsync({
      userId,
      title: 'New Assignment Created',
      message: `A new mentorship assignment has been created between ${advisorName} and ${founderName}. You can now schedule sessions and start collaborating.`,
      type: 'assignment',
      priority: 'high'
    });
  };

  const sendSessionReminder = async (userId: string, sessionTitle: string, sessionTime: string) => {
    return sendEmailNotification.mutateAsync({
      userId,
      title: 'Session Reminder',
      message: `Reminder: Your session "${sessionTitle}" is scheduled for ${sessionTime}. Please make sure to join on time.`,
      type: 'session_reminder',
      priority: 'high'
    });
  };

  const sendGoalUpdateNotification = async (userId: string, goalTitle: string, progress: number) => {
    return sendEmailNotification.mutateAsync({
      userId,
      title: 'Goal Progress Update',
      message: `Great progress! Your goal "${goalTitle}" is now ${progress}% complete. Keep up the excellent work!`,
      type: 'goal_update',
      priority: 'normal'
    });
  };

  const sendEscalationNotification = async (userId: string, issueDescription: string, fromUser: string) => {
    return sendEmailNotification.mutateAsync({
      userId,
      title: 'URGENT: Issue Escalation',
      message: `An urgent issue has been escalated by ${fromUser}: "${issueDescription.substring(0, 100)}...". Please review and respond immediately.`,
      type: 'escalation',
      priority: 'urgent'
    });
  };

  return {
    sendWelcomeEmail,
    sendAssignmentNotification,
    sendSessionReminder,
    sendGoalUpdateNotification,
    sendEscalationNotification,
    isLoading: sendEmailNotification.isPending
  };
};
