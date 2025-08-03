
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ActualMetrics {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  activeAssignments: number;
  unreadNotifications: number;
  activeGoals: number;
  completedGoals: number;
  averageRating: number;
  responseRate: number;
  matchingScore: number;
}

export const useActualDashboardMetrics = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['actual-dashboard-metrics', userProfile?.id],
    queryFn: async (): Promise<ActualMetrics> => {
      if (!userProfile) {
        return {
          totalSessions: 0,
          completedSessions: 0,
          upcomingSessions: 0,
          activeAssignments: 0,
          unreadNotifications: 0,
          activeGoals: 0,
          completedGoals: 0,
          averageRating: 0,
          responseRate: 0,
          matchingScore: 0
        };
      }

      // Get user assignments
      const { data: assignments } = await supabase
        .from('advisor_founder_assignments')
        .select('id, match_score, status')
        .or(`advisor_id.eq.${userProfile.id},founder_id.eq.${userProfile.id}`)
        .is('deleted_at', null);

      const assignmentIds = assignments?.map(a => a.id) || [];
      const activeAssignments = assignments?.filter(a => a.status === 'active').length || 0;

      // Get sessions data
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, status, scheduled_at, founder_rating, advisor_rating')
        .in('assignment_id', assignmentIds)
        .is('deleted_at', null);

      const now = new Date();
      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const upcomingSessions = sessions?.filter(s => 
        new Date(s.scheduled_at) > now && s.status === 'scheduled'
      ).length || 0;

      // Calculate average rating
      const ratingsSum = sessions?.reduce((sum, session) => {
        const founderRating = session.founder_rating || 0;
        const advisorRating = session.advisor_rating || 0;
        const avgRating = (founderRating + advisorRating) / 2;
        return sum + avgRating;
      }, 0) || 0;
      
      const averageRating = completedSessions > 0 ? ratingsSum / completedSessions : 0;
      const responseRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      // Get notifications count
      const { count: unreadNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false)
        .is('deleted_at', null);

      // Get goals data (only for founders)
      let activeGoals = 0;
      let completedGoals = 0;
      
      if (userProfile.role === 'founder') {
        const { data: goals } = await supabase
          .from('goals')
          .select('id, status')
          .eq('founder_id', userProfile.id)
          .is('deleted_at', null);

        activeGoals = goals?.filter(g => g.status === 'active').length || 0;
        completedGoals = goals?.filter(g => g.status === 'completed').length || 0;
      }

      // Calculate average matching score
      const matchingScore = assignments && assignments.length > 0
        ? Math.round(assignments.reduce((sum, a) => sum + (a.match_score || 0), 0) / assignments.length)
        : 0;

      return {
        totalSessions,
        completedSessions,
        upcomingSessions,
        activeAssignments,
        unreadNotifications: unreadNotifications || 0,
        activeGoals,
        completedGoals,
        averageRating: Math.round(averageRating * 10) / 10,
        responseRate: Math.round(responseRate),
        matchingScore
      };
    },
    enabled: !!userProfile,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000 // Consider stale after 30 seconds
  });
};
