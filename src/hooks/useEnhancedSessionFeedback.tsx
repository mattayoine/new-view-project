
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SessionFeedbackData {
  sessionId: string;
  overallRating: number;
  preparationRating: number;
  communicationRating: number;
  valueRating: number;
  whatWentWell: string;
  whatCouldImprove: string;
  actionItems: string[];
  additionalComments?: string;
  wouldRecommend: boolean;
  isAnonymous?: boolean;
}

export const useSubmitSessionFeedback = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (feedbackData: SessionFeedbackData) => {
      if (!user) throw new Error('User not authenticated');

      // Get user's internal ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // Submit feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from('session_feedback')
        .insert({
          session_id: feedbackData.sessionId,
          feedback_by: userData.id,
          overall_rating: feedbackData.overallRating,
          preparation_rating: feedbackData.preparationRating,
          communication_rating: feedbackData.communicationRating,
          value_rating: feedbackData.valueRating,
          what_went_well: feedbackData.whatWentWell,
          what_could_improve: feedbackData.whatCouldImprove,
          action_items: feedbackData.actionItems,
          additional_comments: feedbackData.additionalComments,
          would_recommend: feedbackData.wouldRecommend,
          is_anonymous: feedbackData.isAnonymous || false
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // Update session with feedback summary
      const { error: sessionUpdateError } = await supabase
        .from('sessions')
        .update({
          what_went_well: feedbackData.whatWentWell,
          what_could_improve: feedbackData.whatCouldImprove,
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackData.sessionId);

      if (sessionUpdateError) throw sessionUpdateError;

      return feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-feedback'] });
      toast.success('Feedback submitted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    }
  });
};

export const useSessionFeedback = (sessionId: string) => {
  return useQuery({
    queryKey: ['session-feedback', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_feedback')
        .select(`
          *,
          feedback_by_user:users!feedback_by(email)
        `)
        .eq('session_id', sessionId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId
  });
};
