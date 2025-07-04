
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateMatchScore, rankAdvisorsByMatch, MatchCandidate } from '@/utils/matchingAlgorithm';
import { toast } from 'sonner';

export const useCalculateMatches = (founderId?: string) => {
  return useQuery({
    queryKey: ['matches', founderId],
    queryFn: async () => {
      if (!founderId) return [];

      // Get founder profile
      const { data: founder, error: founderError } = await supabase
        .from('users')
        .select(`
          *,
          founder_profiles:user_profiles!inner(profile_data)
        `)
        .eq('id', founderId)
        .eq('user_profiles.profile_type', 'founder')
        .single();

      if (founderError) throw founderError;

      // Get all advisors
      const { data: advisors, error: advisorsError } = await supabase
        .from('users')
        .select(`
          *,
          advisor_profiles:user_profiles!inner(profile_data)
        `)
        .eq('role', 'advisor')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (advisorsError) throw advisorsError;

      const founderProfile = founder.founder_profiles[0]?.profile_data;
      if (!founderProfile) return [];

      // Calculate matches using the algorithm
      return rankAdvisorsByMatch(founderProfile, advisors);
    },
    enabled: !!founderId
  });
};

export const useBulkAssignments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignments: Array<{
      founderId: string;
      advisorId: string;
      matchScore?: number;
      notes?: string;
    }>) => {
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!currentUser) throw new Error('User not found');

      const assignmentData = assignments.map(assignment => ({
        founder_id: assignment.founderId,
        advisor_id: assignment.advisorId,
        match_score: assignment.matchScore || 0,
        assigned_by: currentUser.id,
        notes: assignment.notes || `Bulk assignment - ${assignment.matchScore || 0}% match`,
        status: 'pending'
      }));

      const { data, error } = await supabase
        .from('advisor_founder_assignments')
        .insert(assignmentData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['founders-directory'] });
      queryClient.invalidateQueries({ queryKey: ['advisors-directory'] });
      toast.success(`${data.length} assignments created successfully!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create bulk assignments: ${error.message}`);
    }
  });
};

export const useTerminateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      terminationReason,
      effectiveDate 
    }: { 
      assignmentId: string; 
      terminationReason: string;
      effectiveDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('advisor_founder_assignments')
        .update({
          status: 'terminated',
          notes: `Terminated: ${terminationReason}`,
          completed_at: effectiveDate || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;

      // Cancel any pending sessions for this assignment
      await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          outcome_summary: 'Assignment terminated'
        })
        .eq('assignment_id', assignmentId)
        .eq('status', 'scheduled');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment terminated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to terminate assignment: ${error.message}`);
    }
  });
};
