
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRetryWithBackoff } from './useRetryWithBackoff';
import { useOfflineSupport } from './useOfflineSupport';
import { toast } from 'sonner';

export interface SessionFlowData {
  upcomingSessions: any[];
  completedSessions: any[];
  sessionProposals: any[];
  activeAssignments: any[];
  sessionMetrics: {
    totalSessions: number;
    completedSessions: number;
    averageRating: number;
    upcomingCount: number;
  };
}

export const useSessionFlow = () => {
  const { userProfile } = useAuth();
  const { executeWithRetry } = useRetryWithBackoff();
  const { executeOperation } = useOfflineSupport();

  return useQuery({
    queryKey: ['session-flow', userProfile?.id],
    queryFn: () => executeWithRetry(async (): Promise<SessionFlowData> => {
      if (!userProfile) {
        return {
          upcomingSessions: [],
          completedSessions: [],
          sessionProposals: [],
          activeAssignments: [],
          sessionMetrics: {
            totalSessions: 0,
            completedSessions: 0,
            averageRating: 0,
            upcomingCount: 0
          }
        };
      }

      // Get active assignments for this user using the correct property name
      const { data: assignments } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          advisor:users!advisor_id(id, email),
          founder:users!founder_id(id, email)
        `)
        .or(`advisor_id.eq.${userProfile.id},founder_id.eq.${userProfile.id}`)
        .eq('status', 'active');

      const assignmentIds = assignments?.map(a => a.id) || [];

      // Get sessions for these assignments
      const { data: allSessions } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:advisor_founder_assignments(
            id,
            advisor:users!advisor_id(id, email),
            founder:users!founder_id(id, email)
          )
        `)
        .in('assignment_id', assignmentIds)
        .order('scheduled_at', { ascending: true });

      // Get session proposals
      const { data: proposals } = await supabase
        .from('session_proposals')
        .select('*')
        .in('assignment_id', assignmentIds)
        .eq('status', 'pending');

      const now = new Date();
      const upcomingSessions = allSessions?.filter(s => 
        new Date(s.scheduled_at) > now && s.status === 'scheduled'
      ) || [];
      
      const completedSessions = allSessions?.filter(s => 
        s.status === 'completed'
      ) || [];

      // Calculate metrics
      const totalSessions = allSessions?.length || 0;
      const completedCount = completedSessions.length;
      const upcomingCount = upcomingSessions.length;
      
      const ratingsSum = completedSessions.reduce((sum, session) => {
        const founderRating = session.founder_rating || 0;
        const advisorRating = session.advisor_rating || 0;
        const avgRating = (founderRating + advisorRating) / 2;
        return sum + avgRating;
      }, 0);
      
      const averageRating = completedCount > 0 ? ratingsSum / completedCount : 0;

      return {
        upcomingSessions,
        completedSessions,
        sessionProposals: proposals || [],
        activeAssignments: assignments || [],
        sessionMetrics: {
          totalSessions,
          completedSessions: completedCount,
          averageRating,
          upcomingCount
        }
      };
    }, {
      maxRetries: 3,
      onRetry: (attempt) => console.log(`Retrying session flow fetch (attempt ${attempt})`)
    }),
    enabled: !!userProfile,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // 30 seconds
  });
};

export const useCreateSessionProposal = () => {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const { executeOperation } = useOfflineSupport();

  return useMutation({
    mutationFn: async (params: {
      assignmentId: string;
      title: string;
      description?: string;
      proposedTimes: string[];
    }) => {
      return executeOperation(async () => {
        const { data, error } = await supabase
          .from('session_proposals')
          .insert({
            assignment_id: params.assignmentId,
            title: params.title,
            description: params.description,
            proposed_times: params.proposedTimes,
            proposed_by: userProfile?.id,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }, 'Create session proposal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-flow'] });
      toast.success('Session proposal created successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to create session proposal: ${error.message}`);
    }
  });
};

export const useUpdateSessionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      status,
      notes,
      rating
    }: {
      sessionId: string;
      status: string;
      notes?: string;
      rating?: number;
    }) => {
      const updateData: any = { status };
      
      if (notes) updateData.outcome_summary = notes;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Add session feedback if rating provided
      if (status === 'completed' && rating) {
        await supabase
          .from('session_feedback')
          .insert({
            session_id: sessionId,
            overall_rating: rating,
            feedback_by: (await supabase.auth.getUser()).data.user?.id
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-flow'] });
      toast.success('Session updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update session: ${error.message}`);
    }
  });
};
