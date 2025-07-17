import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SessionLifecycleData {
  sessionId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  duration: number;
  meetingLink?: string;
  notes?: string;
  feedback?: {
    founderRating?: number;
    advisorRating?: number;
    founderFeedback?: string;
    advisorFeedback?: string;
  };
}

export const useCompleteSessionLifecycle = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, action, data }: {
      sessionId: string;
      action: 'start' | 'complete' | 'cancel' | 'reschedule';
      data?: any;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userRecord) throw new Error('User record not found');

      let updateData: any = { updated_at: new Date().toISOString() };

      switch (action) {
        case 'start':
          updateData.status = 'in_progress';
          break;
          
        case 'complete':
          updateData = {
            ...updateData,
            status: 'completed',
            outcome_summary: data?.summary || 'Session completed successfully',
            notes: data?.notes,
            what_went_well: data?.whatWentWell,
            what_could_improve: data?.whatCouldImprove
          };
          break;
          
        case 'cancel':
          updateData = {
            ...updateData,
            status: 'cancelled',
            outcome_summary: `Cancelled: ${data?.reason || 'No reason provided'}`
          };
          break;
          
        case 'reschedule':
          updateData = {
            ...updateData,
            scheduled_at: data?.newDateTime,
            rescheduled_from: sessionId
          };
          break;
      }

      // Update session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select(`
          *,
          assignment:advisor_founder_assignments(
            advisor:users!advisor_id(id, email),
            founder:users!founder_id(id, email)
          )
        `)
        .single();

      if (sessionError) throw sessionError;

      // Handle post-action workflows
      if (action === 'complete') {
        // Trigger session analysis
        try {
          await supabase.functions.invoke('analyze-session', {
            body: { sessionId }
          });
        } catch (error) {
          console.error('Failed to trigger session analysis:', error);
        }

        // Create notifications for feedback
        await Promise.all([
          supabase.from('notifications').insert({
            user_id: session.assignment.advisor.id,
            type: 'session',
            title: 'Session Completed',
            message: `Session "${session.title}" has been completed. Please provide feedback.`,
            priority: 'normal'
          }),
          supabase.from('notifications').insert({
            user_id: session.assignment.founder.id,
            type: 'session',
            title: 'Session Completed',
            message: `Session "${session.title}" has been completed. Please provide feedback.`,
            priority: 'normal'
          })
        ]);
      }

      if (action === 'cancel') {
        // Send cancellation notifications
        await Promise.all([
          supabase.from('notifications').insert({
            user_id: session.assignment.advisor.id,
            type: 'session',
            title: 'Session Cancelled',
            message: `Session "${session.title}" has been cancelled.`,
            priority: 'high'
          }),
          supabase.from('notifications').insert({
            user_id: session.assignment.founder.id,
            type: 'session',
            title: 'Session Cancelled',
            message: `Session "${session.title}" has been cancelled.`,
            priority: 'high'
          })
        ]);
      }

      return session;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['user-journey-status'] });
      
      const actionMessages = {
        start: 'Session started',
        complete: 'Session completed successfully',
        cancel: 'Session cancelled',
        reschedule: 'Session rescheduled'
      };
      
      toast.success(actionMessages[variables.action]);
    },
    onError: (error: any) => {
      toast.error(`Failed to update session: ${error.message}`);
    }
  });
};

export const useSessionFeedbackSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, feedback }: {
      sessionId: string;
      feedback: {
        rating: number;
        feedbackText: string;
        whatWentWell?: string;
        whatCouldImprove?: string;
        actionItems?: string[];
      };
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: userRecord } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_id', user.id)
        .single();

      if (!userRecord) throw new Error('User record not found');

      // Determine which rating field to update based on user role
      const ratingField = userRecord.role === 'advisor' ? 'advisor_rating' : 'founder_rating';
      const feedbackField = userRecord.role === 'advisor' ? 'advisor_feedback_text' : 'founder_feedback_text';

      // Update session with feedback
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({
          [ratingField]: feedback.rating,
          [feedbackField]: feedback.feedbackText,
          what_went_well: feedback.whatWentWell,
          what_could_improve: feedback.whatCouldImprove,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Create detailed feedback record
      const { data: feedbackRecord, error: feedbackError } = await supabase
        .from('session_feedback')
        .insert({
          session_id: sessionId,
          feedback_by: userRecord.id,
          overall_rating: feedback.rating,
          what_went_well: feedback.whatWentWell,
          what_could_improve: feedback.whatCouldImprove,
          action_items: feedback.actionItems || [],
          additional_comments: feedback.feedbackText
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      return feedbackRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-feedback'] });
      toast.success('Feedback submitted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to submit feedback: ${error.message}`);
    }
  });
};

export const useSessionScheduling = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ assignmentId, sessionData }: {
      assignmentId: string;
      sessionData: {
        title: string;
        description?: string;
        scheduledAt: string;
        duration: number;
        sessionType: string;
        locationType: 'virtual' | 'in_person';
      };
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          assignment_id: assignmentId,
          title: sessionData.title,
          description: sessionData.description,
          scheduled_at: sessionData.scheduledAt,
          duration_minutes: sessionData.duration,
          session_type: sessionData.sessionType,
          location_type: sessionData.locationType,
          status: 'scheduled'
        })
        .select(`
          *,
          assignment:advisor_founder_assignments(
            advisor:users!advisor_id(id, email),
            founder:users!founder_id(id, email)
          )
        `)
        .single();

      if (sessionError) throw sessionError;

      // Generate meeting link for virtual sessions
      if (sessionData.locationType === 'virtual') {
        try {
          const { data: meetingData } = await supabase.functions.invoke('generate-meeting-link', {
            body: { sessionId: session.id, platform: 'google-meet' }
          });

          if (meetingData?.meetingLink) {
            await supabase
              .from('sessions')
              .update({ meeting_link: meetingData.meetingLink })
              .eq('id', session.id);
          }
        } catch (error) {
          console.error('Failed to generate meeting link:', error);
        }
      }

      // Send notifications
      await Promise.all([
        supabase.from('notifications').insert({
          user_id: session.assignment.advisor.id,
          type: 'session',
          title: 'New Session Scheduled',
          message: `Session "${session.title}" has been scheduled for ${new Date(sessionData.scheduledAt).toLocaleDateString()}`,
          priority: 'normal'
        }),
        supabase.from('notifications').insert({
          user_id: session.assignment.founder.id,
          type: 'session',
          title: 'New Session Scheduled',
          message: `Session "${session.title}" has been scheduled for ${new Date(sessionData.scheduledAt).toLocaleDateString()}`,
          priority: 'normal'
        })
      ]);

      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['user-journey-status'] });
      toast.success('Session scheduled successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to schedule session: ${error.message}`);
    }
  });
};

export const useSessionReminders = () => {
  return useQuery({
    queryKey: ['session-reminders'],
    queryFn: async () => {
      // Get sessions that need reminders (24 hours and 1 hour before)
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:advisor_founder_assignments(
            advisor:users!advisor_id(id, email),
            founder:users!founder_id(id, email)
          )
        `)
        .eq('status', 'scheduled')
        .or(`scheduled_at.gte.${tomorrow.toISOString()}.and.scheduled_at.lte.${new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString()},scheduled_at.gte.${oneHourFromNow.toISOString()}.and.scheduled_at.lte.${new Date(oneHourFromNow.getTime() + 60 * 60 * 1000).toISOString()}`);

      if (error) throw error;

      return sessions || [];
    },
    refetchInterval: 5 * 60 * 1000 // Check every 5 minutes
  });
};