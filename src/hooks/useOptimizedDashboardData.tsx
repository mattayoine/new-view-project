
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRetryWithBackoff } from './useRetryWithBackoff';
import { useMemo } from 'react';

interface OptimizedDashboardData {
  assignments: any[];
  sessions: any[];
  notifications: any[];
  metrics: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    unreadNotifications: number;
    averageRating: number;
    responseRate: number;
  };
  recentActivity: any[];
}

export const useOptimizedDashboardData = () => {
  const { user, userProfile } = useAuth();
  const { executeWithRetry } = useRetryWithBackoff();

  const fetchDashboardData = async (): Promise<OptimizedDashboardData> => {
    if (!user || !userProfile) {
      throw new Error('User not authenticated');
    }

    // Parallel data fetching for better performance
    const [assignmentsResult, sessionsResult, notificationsResult] = await Promise.allSettled([
      supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          advisor:users!advisor_id(id, email),
          founder:users!founder_id(id, email)
        `)
        .or(`advisor_id.eq.${userProfile.id},founder_id.eq.${userProfile.id}`)
        .eq('status', 'active')
        .limit(10),
      
      supabase
        .from('sessions')
        .select('*')
        .in('assignment_id', 
          await supabase
            .from('advisor_founder_assignments')
            .select('id')
            .or(`advisor_id.eq.${userProfile.id},founder_id.eq.${userProfile.id}`)
            .eq('status', 'active')
            .then(res => res.data?.map(a => a.id) || [])
        )
        .order('scheduled_at', { ascending: false })
        .limit(20),
      
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(15)
    ]);

    const assignments = assignmentsResult.status === 'fulfilled' ? assignmentsResult.value.data || [] : [];
    const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.data || [] : [];
    const notifications = notificationsResult.status === 'fulfilled' ? notificationsResult.value.data || [] : [];

    // Calculate metrics efficiently
    const now = new Date();
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = sessions.filter(s => 
      new Date(s.scheduled_at) > now && s.status === 'scheduled'
    ).length;
    const unreadNotifications = notifications.filter(n => !n.is_read).length;

    // Calculate average rating
    const ratingsSum = sessions
      .filter(s => s.status === 'completed' && (s.founder_rating || s.advisor_rating))
      .reduce((sum, session) => {
        const founderRating = session.founder_rating || 0;
        const advisorRating = session.advisor_rating || 0;
        return sum + ((founderRating + advisorRating) / 2);
      }, 0);

    const averageRating = completedSessions > 0 ? ratingsSum / completedSessions : 0;
    const responseRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Generate recent activity
    const recentActivity = [
      ...sessions.slice(0, 5).map(s => ({
        type: 'session',
        title: s.title,
        status: s.status,
        date: s.scheduled_at,
        data: s
      })),
      ...notifications.slice(0, 5).map(n => ({
        type: 'notification',
        title: n.title,
        status: n.is_read ? 'read' : 'unread',
        date: n.created_at,
        data: n
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
      assignments,
      sessions,
      notifications,
      metrics: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        unreadNotifications,
        averageRating,
        responseRate
      },
      recentActivity
    };
  };

  const queryResult = useQuery({
    queryKey: ['optimized-dashboard-data', userProfile?.id],
    queryFn: () => executeWithRetry(fetchDashboardData, {
      maxRetries: 3,
      onRetry: (attempt) => console.log(`Retrying dashboard data fetch (attempt ${attempt})`),
      onMaxRetriesReached: (error) => console.error('Failed to fetch dashboard data after all retries:', error)
    }),
    enabled: !!user && !!userProfile,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchInterval: 60000, // 1 minute
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false // We handle retries manually
  });

  const memoizedData = useMemo(() => {
    return queryResult.data || {
      assignments: [],
      sessions: [],
      notifications: [],
      metrics: {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        unreadNotifications: 0,
        averageRating: 0,
        responseRate: 0
      },
      recentActivity: []
    };
  }, [queryResult.data]);

  return {
    ...queryResult,
    data: memoizedData
  };
};
