
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAutomatedSessionWorkflow } from './useSessionIntegrations';
import { toast } from 'sonner';

export const useRescheduleSession = () => {
  const queryClient = useQueryClient();
  const { executeWorkflow } = useAutomatedSessionWorkflow();

  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      newScheduledAt, 
      reason 
    }: { 
      sessionId: string; 
      newScheduledAt: string; 
      reason?: string; 
    }) => {
      // Get session details first
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:advisor_founder_assignments(
            advisor:users!advisor_id(email),
            founder:users!founder_id(email)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Update session with new time
      const { data: updatedSession, error: updateError } = await supabase
        .from('sessions')
        .update({
          scheduled_at: newScheduledAt,
          rescheduled_from: sessionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Execute workflow for calendar and email updates
      await executeWorkflow(sessionId, 'reschedule', {
        title: session.title,
        description: session.description,
        scheduledAt: newScheduledAt,
        duration: session.duration_minutes || 60,
        advisorEmail: session.assignment.advisor.email,
        founderEmail: session.assignment.founder.email,
        rescheduleReason: reason
      });

      return updatedSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session rescheduled successfully');
    },
    onError: (error: any) => {
      console.error('Failed to reschedule session:', error);
      toast.error('Failed to reschedule session');
    }
  });
};

export const useCancelSession = () => {
  const queryClient = useQueryClient();
  const { executeWorkflow } = useAutomatedSessionWorkflow();

  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      cancellationReason 
    }: { 
      sessionId: string; 
      cancellationReason: string; 
    }) => {
      const { data: updatedSession, error } = await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          outcome_summary: `Cancelled: ${cancellationReason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Execute workflow for calendar deletion and notifications
      await executeWorkflow(sessionId, 'cancel', {
        cancellationReason
      });

      return updatedSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session cancelled successfully');
    },
    onError: (error: any) => {
      console.error('Failed to cancel session:', error);
      toast.error('Failed to cancel session');
    }
  });
};
