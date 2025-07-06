
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRecalculateAssignmentMetrics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId?: string) => {
      // Since the database has triggers that automatically update metrics,
      // we just need to trigger a small update to force the trigger to run
      if (assignmentId) {
        const { data, error } = await supabase
          .from('advisor_founder_assignments')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', assignmentId)
          .select();
        if (error) throw error;
        return data;
      } else {
        // For all assignments, we'll update all of them to trigger the metrics recalculation
        const { data, error } = await supabase
          .from('advisor_founder_assignments')
          .update({ updated_at: new Date().toISOString() })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all assignments
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment metrics updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update metrics: ${error.message}`);
      console.error('Assignment metrics error:', error);
    }
  });
};

export const useAssignmentMetrics = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment-metrics', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          sessions!inner(
            id,
            status,
            founder_rating,
            advisor_rating,
            duration_minutes,
            scheduled_at
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (error) throw error;

      // Calculate real-time metrics
      const sessions = data.sessions || [];
      const completedSessions = sessions.filter((s: any) => s.status === 'completed');
      const totalSessions = sessions.length;
      
      const avgRating = completedSessions.length > 0 
        ? completedSessions.reduce((sum: number, s: any) => 
            sum + ((s.founder_rating || 0) + (s.advisor_rating || 0)) / 2, 0
          ) / completedSessions.length
        : 0;

      return {
        ...data,
        calculated_metrics: {
          total_sessions: totalSessions,
          completed_sessions: completedSessions.length,
          avg_rating: avgRating,
          completion_rate: totalSessions > 0 ? (completedSessions.length / totalSessions) * 100 : 0,
          upcoming_sessions: sessions.filter((s: any) => s.status === 'scheduled').length
        }
      };
    },
    enabled: !!assignmentId
  });
};

// Hook to validate and fix assignment data consistency
export const useValidateAssignments = () => {
  return useMutation({
    mutationFn: async () => {
      // Check for assignments with inconsistent metrics
      const { data: assignments, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          sessions(id, status, founder_rating, advisor_rating)
        `);

      if (error) throw error;

      const inconsistentAssignments = [];

      for (const assignment of assignments) {
        const sessions = assignment.sessions || [];
        const completedSessions = sessions.filter((s: any) => s.status === 'completed');
        const actualTotalSessions = sessions.length;
        const actualCompletedSessions = completedSessions.length;
        
        // Check if stored metrics match actual data
        if (assignment.total_sessions !== actualTotalSessions || 
            assignment.completed_sessions !== actualCompletedSessions) {
          inconsistentAssignments.push({
            id: assignment.id,
            stored: {
              total: assignment.total_sessions,
              completed: assignment.completed_sessions
            },
            actual: {
              total: actualTotalSessions,
              completed: actualCompletedSessions
            }
          });
        }
      }

      return inconsistentAssignments;
    },
    onSuccess: (inconsistentAssignments) => {
      if (inconsistentAssignments.length > 0) {
        console.warn('Found inconsistent assignment metrics:', inconsistentAssignments);
        toast.warning(`Found ${inconsistentAssignments.length} assignments with inconsistent metrics`);
      } else {
        toast.success('All assignment metrics are consistent');
      }
    }
  });
};
