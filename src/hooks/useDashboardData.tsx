
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DashboardData {
  userProfile: any;
  assignments: any[];
  sessions: any[];
  goals: any[];
  notifications: any[];
  resources: any[];
  metrics: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    activeGoals: number;
    completedGoals: number;
    averageRating: number;
    responseRate: number;
  };
  recentActivity: any[];
}

export const useDashboardData = () => {
  const { user, userProfile } = useAuth();

  return useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!user || !userProfile) {
        return {
          userProfile: null,
          assignments: [],
          sessions: [],
          goals: [],
          notifications: [],
          resources: [],
          metrics: {
            totalSessions: 0,
            completedSessions: 0,
            upcomingSessions: 0,
            activeGoals: 0,
            completedGoals: 0,
            averageRating: 0,
            responseRate: 0
          },
          recentActivity: []
        };
      }

      // Get user's assignments
      const { data: assignments } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          advisor:users!advisor_id(id, email),
          founder:users!founder_id(id, email)
        `)
        .or(`advisor_id.eq.${userProfile.user_id},founder_id.eq.${userProfile.user_id}`)
        .eq('status', 'active');

      const assignmentIds = assignments?.map(a => a.id) || [];

      // Get sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .in('assignment_id', assignmentIds)
        .order('scheduled_at', { ascending: false })
        .limit(50);

      // Get goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('founder_id', userProfile.user_id)
        .order('created_at', { ascending: false });

      // Get notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get accessible resources
      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .or('access_level.eq.public,shared_by.eq.' + userProfile.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate metrics
      const now = new Date();
      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const upcomingSessions = sessions?.filter(s => 
        new Date(s.scheduled_at) > now && s.status === 'scheduled'
      ).length || 0;
      
      const activeGoals = goals?.filter(g => g.status === 'active').length || 0;
      const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;

      // Calculate average rating
      const completedSessionsWithRating = sessions?.filter(s => 
        s.status === 'completed' && (s.founder_rating || s.advisor_rating)
      ) || [];
      
      const totalRating = completedSessionsWithRating.reduce((sum, session) => {
        const founderRating = session.founder_rating || 0;
        const advisorRating = session.advisor_rating || 0;
        return sum + ((founderRating + advisorRating) / 2);
      }, 0);
      
      const averageRating = completedSessionsWithRating.length > 0 
        ? totalRating / completedSessionsWithRating.length 
        : 0;

      // Calculate response rate (sessions completed vs scheduled)
      const scheduledSessions = sessions?.filter(s => 
        ['scheduled', 'completed', 'cancelled'].includes(s.status)
      ).length || 0;
      const responseRate = scheduledSessions > 0 
        ? (completedSessions / scheduledSessions) * 100 
        : 0;

      // Get recent activity
      const recentActivity = [
        ...sessions?.slice(0, 5).map(s => ({
          type: 'session',
          title: s.title,
          status: s.status,
          date: s.scheduled_at,
          data: s
        })) || [],
        ...goals?.slice(0, 3).map(g => ({
          type: 'goal',
          title: g.title,
          status: g.status,
          date: g.updated_at,
          data: g
        })) || [],
        ...notifications?.slice(0, 5).map(n => ({
          type: 'notification',
          title: n.title,
          status: n.is_read ? 'read' : 'unread',
          date: n.created_at,
          data: n
        })) || []
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      return {
        userProfile,
        assignments: assignments || [],
        sessions: sessions || [],
        goals: goals || [],
        notifications: notifications || [],
        resources: resources || [],
        metrics: {
          totalSessions,
          completedSessions,
          upcomingSessions,
          activeGoals,
          completedGoals,
          averageRating,
          responseRate
        },
        recentActivity
      };
    },
    enabled: !!user && !!userProfile,
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000 // Consider data stale after 1 minute
  });
};

export const useUserMetrics = () => {
  const { data: dashboardData } = useDashboardData();
  
  return {
    metrics: dashboardData?.metrics || {
      totalSessions: 0,
      completedSessions: 0,
      upcomingSessions: 0,
      activeGoals: 0,
      completedGoals: 0,
      averageRating: 0,
      responseRate: 0
    },
    isLoading: !dashboardData
  };
};
