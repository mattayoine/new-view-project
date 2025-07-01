
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SessionPortfolioItem {
  assignmentId: string;
  founderId: string;
  founderName: string;
  founderEmail: string;
  totalSessions: number;
  completedSessions: number;
  nextSessionDate?: string;
  lastSessionDate?: string;
  status: 'active' | 'on_hold' | 'completed';
  urgentActions: string[];
  overallProgress: number;
  avgRating: number;
}

export const useSessionPortfolio = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-portfolio', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: advisor, error: advisorError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .eq('role', 'advisor')
        .single();

      if (advisorError) throw advisorError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          id, founder_id, total_sessions, completed_sessions, avg_rating,
          founder:users!founder_id(id, email),
          sessions:sessions(
            id, title, scheduled_at, status, created_at,
            founder_rating, advisor_rating
          )
        `)
        .eq('advisor_id', advisor.id)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (assignmentsError) throw assignmentsError;

      const sessionPortfolio: SessionPortfolioItem[] = (assignments || []).map(assignment => {
        const sessions = assignment.sessions || [];
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const upcomingSessions = sessions.filter(s => 
          s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
        );
        
        const avgRating = completedSessions.length > 0
          ? completedSessions.reduce((sum, s) => sum + ((s.founder_rating || 0) + (s.advisor_rating || 0)) / 2, 0) / completedSessions.length
          : 0;

        return {
          assignmentId: assignment.id,
          founderId: assignment.founder_id,
          founderName: assignment.founder?.email || 'Unknown',
          founderEmail: assignment.founder?.email || '',
          totalSessions: assignment.total_sessions || 0,
          completedSessions: assignment.completed_sessions || 0,
          nextSessionDate: upcomingSessions[0]?.scheduled_at,
          lastSessionDate: completedSessions[0]?.scheduled_at,
          status: 'active' as const,
          urgentActions: [],
          overallProgress: 75,
          avgRating: Math.round(avgRating * 10) / 10
        };
      });

      return sessionPortfolio;
    },
    enabled: !!user,
    refetchInterval: 30000
  });
};
