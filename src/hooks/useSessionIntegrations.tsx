
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CalendarSyncData {
  sessionId: string;
  action: 'create' | 'update' | 'delete';
  sessionData?: {
    title: string;
    description: string;
    scheduledAt: string;
    duration: number;
    advisorEmail: string;
    founderEmail: string;
    meetingLink?: string;
  };
}

export interface EmailWorkflowData {
  sessionId: string;
  emailType: 'scheduled' | 'reminder' | 'completed' | 'cancelled' | 'rescheduled';
  recipientType: 'advisor' | 'founder' | 'both';
  customData?: Record<string, any>;
}

export const useCalendarSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CalendarSyncData) => {
      const { data: result, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: data
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success(`Calendar event ${variables.action}d successfully`);
    },
    onError: (error: any) => {
      console.error('Calendar sync error:', error);
      toast.error(`Calendar sync failed: ${error.message}`);
    }
  });
};

export const useEmailWorkflow = () => {
  return useMutation({
    mutationFn: async (data: EmailWorkflowData) => {
      const { data: result, error } = await supabase.functions.invoke('session-email-workflows', {
        body: data
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      console.log('Email workflow completed:', data);
      if (data.emailsSent > 0) {
        toast.success(`${data.emailsSent} email(s) sent successfully`);
      }
    },
    onError: (error: any) => {
      console.error('Email workflow error:', error);
      toast.error(`Email workflow failed: ${error.message}`);
    }
  });
};

export const useAutomatedSessionWorkflow = () => {
  const calendarSync = useCalendarSync();
  const emailWorkflow = useEmailWorkflow();

  const executeWorkflow = async (
    sessionId: string,
    action: 'create' | 'update' | 'complete' | 'cancel' | 'reschedule',
    sessionData?: any,
    customData?: Record<string, any>
  ) => {
    try {
      // Calendar operations
      if (action === 'create' || action === 'update' || action === 'reschedule') {
        await calendarSync.mutateAsync({
          sessionId,
          action: action === 'reschedule' ? 'update' : action,
          sessionData
        });
      } else if (action === 'cancel') {
        await calendarSync.mutateAsync({
          sessionId,
          action: 'delete'
        });
      }

      // Email operations
      let emailType: EmailWorkflowData['emailType'];
      switch (action) {
        case 'create':
          emailType = 'scheduled';
          break;
        case 'complete':
          emailType = 'completed';
          break;
        case 'cancel':
          emailType = 'cancelled';
          break;
        case 'reschedule':
          emailType = 'rescheduled';
          break;
        default:
          return; // No email for update
      }

      await emailWorkflow.mutateAsync({
        sessionId,
        emailType,
        recipientType: 'both',
        customData
      });

    } catch (error) {
      console.error('Automated workflow error:', error);
      throw error;
    }
  };

  return {
    executeWorkflow,
    isLoading: calendarSync.isPending || emailWorkflow.isPending
  };
};

// Scheduled email reminders hook
export const useScheduledReminders = () => {
  return useMutation({
    mutationFn: async () => {
      // This would be called by a cron job to send reminders
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:advisor_founder_assignments(
            advisor:users!advisor_id(email),
            founder:users!founder_id(email)
          )
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()); // Next 25 hours

      if (error) throw error;

      const reminderPromises = data.map(session => 
        supabase.functions.invoke('session-email-workflows', {
          body: {
            sessionId: session.id,
            emailType: 'reminder',
            recipientType: 'both'
          }
        })
      );

      await Promise.all(reminderPromises);
      return { remindersSent: data.length };
    }
  });
};
