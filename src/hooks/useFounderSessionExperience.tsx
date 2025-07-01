
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FounderSessionStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  averageRating: number;
  actionItemsCompleted: number;
  goalProgress: number;
}

export interface SessionGoalLink {
  sessionId: string;
  goalId: string;
  sessionTitle: string;
  goalTitle: string;
  progressContribution: number;
}

export const useFounderSessionStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['founder-session-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get founder's user record
      const { data: founder, error: founderError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .eq('role', 'founder')
        .single();

      if (founderError) throw founderError;

      // Get assignments with sessions
      const { data: assignments, error: assignmentsError } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          sessions(*)
        `)
        .eq('founder_id', founder.id)
        .eq('status', 'active');

      if (assignmentsError) throw assignmentsError;

      const allSessions = assignments?.flatMap(a => a.sessions || []) || [];
      const completedSessions = allSessions.filter(s => s.status === 'completed');
      const upcomingSessions = allSessions.filter(s => 
        s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
      );

      const avgRating = completedSessions.reduce((sum, s) => sum + (s.founder_rating || 0), 0) / 
                       (completedSessions.length || 1);

      const stats: FounderSessionStats = {
        totalSessions: allSessions.length,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length,
        averageRating: avgRating,
        actionItemsCompleted: 0, // TODO: Calculate from session analysis
        goalProgress: 0 // TODO: Calculate from goals table
      };

      return stats;
    },
    enabled: !!user
  });
};

export const useSessionGoalLinks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-goal-links', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get founder's user record
      const { data: founder, error: founderError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .eq('role', 'founder')
        .single();

      if (founderError) throw founderError;

      // Get sessions and goals for linking
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          assignment_id,
          advisor_founder_assignments!inner(founder_id)
        `)
        .eq('advisor_founder_assignments.founder_id', founder.id);

      if (sessionsError) throw sessionsError;

      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('founder_id', founder.id);

      if (goalsError) throw goalsError;

      // Create links based on session content and goal categories
      const links: SessionGoalLink[] = [];
      
      sessions?.forEach(session => {
        goals?.forEach(goal => {
          // Simple matching logic - in reality this would be more sophisticated
          if (session.title.toLowerCase().includes(goal.category?.toLowerCase() || '') ||
              goal.title.toLowerCase().includes(session.title.toLowerCase())) {
            links.push({
              sessionId: session.id,
              goalId: goal.id,
              sessionTitle: session.title,
              goalTitle: goal.title,
              progressContribution: 10 // Placeholder value
            });
          }
        });
      });

      return links;
    },
    enabled: !!user
  });
};
