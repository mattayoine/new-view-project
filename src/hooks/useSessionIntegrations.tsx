
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
      console.log('Syncing calendar event:', data.action, data.sessionId);
      
      const { data: result, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: data
      });

      if (error) {
        console.error('Calendar sync error:', error);
        throw error;
      }
      
      console.log('Calendar sync result:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      
      if (data.success) {
        toast.success(`Calendar event ${variables.action}d successfully`);
        
        if (data.meetingLink && variables.action === 'create') {
          toast.success('Google Meet link generated!', {
            description: 'Meeting link has been added to the session'
          });
        }
      }
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
      console.log('Triggering email workflow:', data.emailType, data.sessionId);
      
      const { data: result, error } = await supabase.functions.invoke('session-email-workflows', {
        body: data
      });

      if (error) {
        console.error('Email workflow error:', error);
        throw error;
      }
      
      return result;
    },
    onSuccess: (data) => {
      console.log('Email workflow completed:', data);
      if (data?.emailsSent > 0) {
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
      console.log('Executing automated workflow:', action, sessionId);

      // Calendar operations for scheduling/updating sessions
      if (action === 'create' || action === 'update' || action === 'reschedule') {
        const calendarResult = await calendarSync.mutateAsync({
          sessionId,
          action: action === 'reschedule' ? 'update' : action,
          sessionData: {
            title: sessionData?.title || 'Advisory Session',
            description: sessionData?.description || 'Scheduled advisory session',
            scheduledAt: sessionData?.scheduledAt,
            duration: sessionData?.duration || 60,
            advisorEmail: sessionData?.advisorEmail,
            founderEmail: sessionData?.founderEmail
          }
        });

        console.log('Calendar sync completed:', calendarResult);
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

      const emailResult = await emailWorkflow.mutateAsync({
        sessionId,
        emailType,
        recipientType: 'both',
        customData: {
          ...customData,
          rescheduleReason: sessionData?.rescheduleReason,
          cancellationReason: sessionData?.cancellationReason
        }
      });

      console.log('Email workflow completed:', emailResult);

      // Auto-schedule reminders for new sessions
      if (action === 'create' || action === 'reschedule') {
        // Schedule 24h and 1h reminders
        setTimeout(async () => {
          try {
            await fetch(`${window.location.origin}/api/schedule-session-reminder`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, reminderTime: '24h' })
            });
            
            await fetch(`${window.location.origin}/api/schedule-session-reminder`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, reminderTime: '1h' })
            });
          } catch (error) {
            console.error('Failed to schedule reminders:', error);
          }
        }, 1000);
      }

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
      console.log('Triggering scheduled reminders');
      
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

      console.log(`Found ${data?.length || 0} sessions needing reminders`);

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
    },
    onSuccess: (data) => {
      console.log('Scheduled reminders completed:', data);
      toast.success(`${data.remindersSent} reminder(s) sent`);
    },
    onError: (error) => {
      console.error('Scheduled reminders error:', error);
      toast.error('Failed to send scheduled reminders');
    }
  });
};
