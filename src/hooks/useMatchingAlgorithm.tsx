
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MatchingEngine } from '@/services/matchingEngine';
import { rankAdvisorsByMatch, MatchCandidate } from '@/utils/matchingAlgorithm';
import { toast } from 'sonner';

export const useCalculateMatches = (founderId?: string) => {
  return useQuery({
    queryKey: ['matches', founderId],
    queryFn: async () => {
      if (!founderId) return [];

      console.log('Calculating matches for founder:', founderId);
      
      try {
        // Use the MatchingEngine for consistent results
        const matches = await MatchingEngine.getTopMatches(founderId, 20);
        console.log('Retrieved matches:', matches.length);
        return matches;
      } catch (error) {
        console.error('Error calculating matches:', error);
        
        // Fallback to direct calculation if MatchingEngine fails
        const { data: founder, error: founderError } = await supabase
          .from('users')
          .select(`
            *,
            user_profiles!inner(profile_data)
          `)
          .eq('id', founderId)
          .eq('user_profiles.profile_type', 'founder')
          .single();

        if (founderError) {
          console.error('Founder not found:', founderError);
          return [];
        }

        const { data: advisors, error: advisorsError } = await supabase
          .from('users')
          .select(`
            *,
            user_profiles!inner(profile_data)
          `)
          .eq('role', 'advisor')
          .eq('status', 'active')
          .is('deleted_at', null);

        if (advisorsError) {
          console.error('Error fetching advisors:', advisorsError);
          return [];
        }

        const founderProfile = founder.user_profiles[0]?.profile_data;
        if (!founderProfile) {
          console.error('No founder profile data found');
          return [];
        }

        return rankAdvisorsByMatch(founderProfile, advisors);
      }
    },
    enabled: !!founderId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2
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
        status: 'active'
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
      queryClient.invalidateQueries({ queryKey: ['matches'] });
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
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Assignment terminated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to terminate assignment: ${error.message}`);
    }
  });
};

// Hook for forcing recalculation of matches
export const useRecalculateMatches = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (founderId: string) => {
      console.log('Force recalculating matches for founder:', founderId);
      return await MatchingEngine.calculateFounderMatches(founderId, true);
    },
    onSuccess: (data, founderId) => {
      queryClient.invalidateQueries({ queryKey: ['matches', founderId] });
      queryClient.invalidateQueries({ queryKey: ['matching-stats'] });
      toast.success('Matches recalculated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to recalculate matches: ${error.message}`);
    }
  });
};
