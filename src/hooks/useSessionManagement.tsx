import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useAutomatedSessionWorkflow } from './useSessionIntegrations';

export interface SessionProposal {
  id: string;
  assignment_id: string;
  title: string;
  description?: string;
  proposed_times: any[];
  selected_time?: string;
  status: 'pending' | 'approved' | 'rejected';
  proposed_by: string;
  approved_by?: string;
  rejection_reason?: string;
}

export interface SessionData {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  session_type: 'regular' | 'onboarding' | 'goal_review' | 'milestone' | 'emergency';
  location_type: 'virtual' | 'in_person' | 'phone';
  location_details?: string;
  meeting_link?: string;
  preparation_notes?: string;
  assignment_id: string;
}

export const useSessionProposals = (assignmentId?: string) => {
  return useQuery({
    queryKey: ['session-proposals', assignmentId],
    queryFn: async () => {
      let query = supabase
        .from('session_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SessionProposal[];
    },
    enabled: !!assignmentId
  });
};

export const useCreateSessionProposal = () => {
  const queryClient = useQueryClient();
  const { executeWorkflow } = useAutomatedSessionWorkflow();

  return useMutation({
    mutationFn: async (proposal: Omit<SessionProposal, 'id' | 'status'>) => {
      const { data, error } = await supabase
        .from('session_proposals')
        .insert({
          ...proposal,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['session-proposals'] });
      toast.success('Session proposal created successfully');
      
      // If proposal is auto-approved, trigger workflow
      // This would be determined by business logic
      if (data.status === 'approved') {
        try {
          await executeWorkflow(data.session_id, 'create', {
            title: data.title,
            description: data.description,
            scheduledAt: data.selected_time,
            duration: 60, // default duration
            advisorEmail: '', // would be fetched from assignment
            founderEmail: ''  // would be fetched from assignment
          });
        } catch (error) {
          console.error('Failed to execute workflow:', error);
        }
      }
    }
  });
};

export const useApproveSessionProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposalId, selectedTime }: { proposalId: string; selectedTime: string }) => {
      const { data: proposal, error: proposalError } = await supabase
        .from('session_proposals')
        .update({
          status: 'approved',
          selected_time: selectedTime,
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', proposalId)
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Create the actual session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          title: proposal.title,
          description: proposal.description,
          scheduled_at: selectedTime,
          assignment_id: proposal.assignment_id,
          status: 'scheduled'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      return { proposal, session };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session proposal approved and scheduled');
    }
  });
};

export const useSessions = (assignmentId?: string) => {
  return useQuery({
    queryKey: ['sessions', assignmentId],
    queryFn: async () => {
      let query = supabase
        .from('sessions')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SessionData[];
    }
  });
};

export const useUpdateSessionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, status, outcomeData }: { 
      sessionId: string; 
      status: string;
      outcomeData?: {
        outcome_summary?: string;
        notes?: string;
        ai_summary?: string;
      }
    }) => {
      const updateData: any = { status };
      
      if (outcomeData) {
        Object.assign(updateData, outcomeData);
      }

      const { data, error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session status updated');
    }
  });
};
