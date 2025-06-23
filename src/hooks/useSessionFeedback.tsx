
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SessionFeedback {
  id: string;
  session_id: string;
  feedback_by: string;
  overall_rating: number;
  preparation_rating: number;
  communication_rating: number;
  value_rating: number;
  what_went_well?: string;
  what_could_improve?: string;
  action_items?: string[];
  would_recommend?: boolean;
  additional_comments?: string;
  is_anonymous: boolean;
}

export const useSessionFeedback = (sessionId: string) => {
  return useQuery({
    queryKey: ['session-feedback', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_feedback')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as SessionFeedback[];
    },
    enabled: !!sessionId
  });
};

export const useSubmitSessionFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: Omit<SessionFeedback, 'id'>) => {
      const { data, error } = await supabase
        .from('session_feedback')
        .insert(feedback)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session-feedback', data.session_id] });
      toast.success('Feedback submitted successfully');
    }
  });
};
