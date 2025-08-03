
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SessionScheduleData {
  assignmentId: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  location?: string;
  locationType?: 'virtual' | 'in_person' | 'phone';
  preparationNotes?: string;
}

export const useSessionScheduling = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const scheduleSession = useMutation({
    mutationFn: async (data: SessionScheduleData) => {
      if (!userProfile) throw new Error('User not authenticated');

      console.log('Scheduling session:', data);

      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          assignment_id: data.assignmentId,
          title: data.title,
          description: data.description,
          scheduled_at: data.scheduledAt,
          duration_minutes: data.duration || 60,
          location_details: data.location,
          location_type: data.locationType || 'virtual',
          preparation_notes: data.preparationNotes,
          status: 'scheduled'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Get assignment details for notifications
      const { data: assignment, error: assignmentError } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          advisor:users!advisor_id(id, email),
          founder:users!founder_id(id, email)
        `)
        .eq('id', data.assignmentId)
        .single();

      if (assignmentError) throw assignmentError;

      // Create notifications for both parties
      const notifications = [];
      
      if (assignment.advisor) {
        notifications.push({
          user_id: assignment.advisor.id,
          type: 'session_scheduled',
          title: 'New Session Scheduled',
          message: `A new session "${data.title}" has been scheduled for ${new Date(data.scheduledAt).toLocaleDateString()}`,
          priority: 'high',
          action_url: `/sessions/${session.id}`,
          metadata: { session_id: session.id, assignment_id: data.assignmentId }
        });
      }

      if (assignment.founder) {
        notifications.push({
          user_id: assignment.founder.id,
          type: 'session_scheduled',
          title: 'New Session Scheduled',
          message: `A new session "${data.title}" has been scheduled for ${new Date(data.scheduledAt).toLocaleDateString()}`,
          priority: 'high',
          action_url: `/sessions/${session.id}`,
          metadata: { session_id: session.id, assignment_id: data.assignmentId }
        });
      }

      // Insert notifications
      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
        }
      }

      // Schedule reminders (24h and 1h before)
      const sessionDate = new Date(data.scheduledAt);
      const reminderTimes = [
        { time: new Date(sessionDate.getTime() - 24 * 60 * 60 * 1000), type: '24h' },
        { time: new Date(sessionDate.getTime() - 60 * 60 * 1000), type: '1h' }
      ];

      for (const reminder of reminderTimes) {
        if (reminder.time > new Date()) {
          for (const userId of [assignment.advisor?.id, assignment.founder?.id].filter(Boolean)) {
            await supabase
              .from('session_reminders')
              .insert({
                session_id: session.id,
                user_id: userId,
                reminder_type: reminder.type,
                scheduled_at: reminder.time.toISOString(),
                status: 'pending'
              });
          }
        }
      }

      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-flow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Session scheduled successfully!', {
        description: `Session "${session.title}" has been scheduled`
      });
    },
    onError: (error: any) => {
      console.error('Error scheduling session:', error);
      toast.error(`Failed to schedule session: ${error.message}`);
    }
  });

  const rescheduleSession = useMutation({
    mutationFn: async ({ 
      sessionId, 
      newScheduledAt, 
      reason 
    }: { 
      sessionId: string; 
      newScheduledAt: string; 
      reason?: string;
    }) => {
      console.log('Rescheduling session:', sessionId, 'to:', newScheduledAt);

      // Update session
      const { data: session, error } = await supabase
        .from('sessions')
        .update({
          scheduled_at: newScheduledAt,
          notes: reason ? `Rescheduled: ${reason}` : 'Rescheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select(`
          *,
          assignment:advisor_founder_assignments(
            advisor:users!advisor_id(id, email),
            founder:users!founder_id(id, email)
          )
        `)
        .single();

      if (error) throw error;

      // Create notifications
      const assignment = session.assignment;
      const notifications = [];

      if (assignment?.advisor) {
        notifications.push({
          user_id: assignment.advisor.id,
          type: 'session_rescheduled',
          title: 'Session Rescheduled',
          message: `Session "${session.title}" has been rescheduled to ${new Date(newScheduledAt).toLocaleDateString()}`,
          priority: 'high',
          action_url: `/sessions/${session.id}`,
          metadata: { session_id: session.id, old_time: session.scheduled_at, new_time: newScheduledAt }
        });
      }

      if (assignment?.founder) {
        notifications.push({
          user_id: assignment.founder.id,
          type: 'session_rescheduled',
          title: 'Session Rescheduled',
          message: `Session "${session.title}" has been rescheduled to ${new Date(newScheduledAt).toLocaleDateString()}`,
          priority: 'high',
          action_url: `/sessions/${session.id}`,
          metadata: { session_id: session.id, old_time: session.scheduled_at, new_time: newScheduledAt }
        });
      }

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-flow'] });
      toast.success('Session rescheduled successfully!');
    },
    onError: (error: any) => {
      console.error('Error rescheduling session:', error);
      toast.error(`Failed to reschedule session: ${error.message}`);
    }
  });

  const cancelSession = useMutation({
    mutationFn: async ({ 
      sessionId, 
      reason 
    }: { 
      sessionId: string; 
      reason?: string;
    }) => {
      console.log('Cancelling session:', sessionId);

      const { data: session, error } = await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          outcome_summary: reason || 'Session cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select(`
          *,
          assignment:advisor_founder_assignments(
            advisor:users!advisor_id(id, email),
            founder:users!founder_id(id, email)
          )
        `)
        .single();

      if (error) throw error;

      // Create notifications
      const assignment = session.assignment;
      const notifications = [];

      if (assignment?.advisor) {
        notifications.push({
          user_id: assignment.advisor.id,
          type: 'session_cancelled',
          title: 'Session Cancelled',
          message: `Session "${session.title}" has been cancelled${reason ? ': ' + reason : ''}`,
          priority: 'normal',
          metadata: { session_id: session.id, reason }
        });
      }

      if (assignment?.founder) {
        notifications.push({
          user_id: assignment.founder.id,
          type: 'session_cancelled',
          title: 'Session Cancelled',
          message: `Session "${session.title}" has been cancelled${reason ? ': ' + reason : ''}`,
          priority: 'normal',
          metadata: { session_id: session.id, reason }
        });
      }

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      // Cancel pending reminders
      await supabase
        .from('session_reminders')
        .update({ status: 'cancelled' })
        .eq('session_id', sessionId)
        .eq('status', 'pending');

      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-flow'] });
      toast.success('Session cancelled successfully');
    },
    onError: (error: any) => {
      console.error('Error cancelling session:', error);
      toast.error(`Failed to cancel session: ${error.message}`);
    }
  });

  return {
    scheduleSession,
    rescheduleSession,
    cancelSession
  };
};
