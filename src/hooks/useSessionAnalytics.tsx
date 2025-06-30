
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export interface SessionMetrics {
  totalSessions: number;
  completedSessions: number;
  avgRating: number;
  completionRate: number;
  avgDuration: number;
}

export interface SessionTrend {
  date: string;
  sessions: number;
  completions: number;
  avgRating: number;
  avgDuration: number;
}

export interface SessionQualityScore {
  sessionId: string;
  qualityScore: number;
  durationScore: number;
  ratingScore: number;
  followupScore: number;
  title: string;
  scheduledAt: string;
}

export const useSessionAnalytics = (timeframe: '7d' | '30d' | '90d' = '30d') => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['session-analytics', timeframe],
    queryFn: async () => {
      const now = new Date();
      const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Get overall metrics
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id, status, scheduled_at, duration_minutes,
          founder_rating, advisor_rating, created_at,
          title, assignment_id
        `)
        .gte('created_at', startDate.toISOString())
        .is('deleted_at', null);

      if (error) throw error;

      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const avgRating = sessions?.reduce((acc, s) => {
        const rating = ((s.founder_rating || 0) + (s.advisor_rating || 0)) / 2;
        return acc + rating;
      }, 0) / (completedSessions || 1);
      const avgDuration = sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / (totalSessions || 1);

      const metrics: SessionMetrics = {
        totalSessions,
        completedSessions,
        avgRating: Math.round(avgRating * 10) / 10,
        completionRate: Math.round((completedSessions / (totalSessions || 1)) * 100),
        avgDuration: Math.round(avgDuration)
      };

      // Calculate daily trends
      const trendMap = new Map<string, {sessions: number, completions: number, ratings: number[], durations: number[]}>();
      
      sessions?.forEach(session => {
        const date = new Date(session.created_at).toISOString().split('T')[0];
        const existing = trendMap.get(date) || {sessions: 0, completions: 0, ratings: [], durations: []};
        
        existing.sessions++;
        if (session.status === 'completed') {
          existing.completions++;
          const rating = ((session.founder_rating || 0) + (session.advisor_rating || 0)) / 2;
          if (rating > 0) existing.ratings.push(rating);
        }
        if (session.duration_minutes) existing.durations.push(session.duration_minutes);
        
        trendMap.set(date, existing);
      });

      const trends: SessionTrend[] = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        sessions: data.sessions,
        completions: data.completions,
        avgRating: data.ratings.length > 0 ? data.ratings.reduce((a, b) => a + b) / data.ratings.length : 0,
        avgDuration: data.durations.length > 0 ? data.durations.reduce((a, b) => a + b) / data.durations.length : 0
      })).sort((a, b) => a.date.localeCompare(b.date));

      return { metrics, trends };
    },
    enabled: !!user
  });

  // Subscribe to real-time updates
  useRealTimeSubscription({
    table: 'sessions',
    queryKey: ['session-analytics', timeframe],
    event: '*'
  });

  return query;
};

export const useSessionQualityScores = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-quality-scores'],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id, title, scheduled_at, status, duration_minutes,
          founder_rating, advisor_rating, notes, ai_summary
        `)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const qualityScores: SessionQualityScore[] = sessions?.map(session => {
        // Calculate quality score components (0-100 each)
        const durationScore = Math.min(100, ((session.duration_minutes || 0) / 60) * 100);
        const avgRating = ((session.founder_rating || 0) + (session.advisor_rating || 0)) / 2;
        const ratingScore = (avgRating / 5) * 100;
        const followupScore = (session.notes || session.ai_summary) ? 100 : 0;
        
        // Weighted average: duration 30%, rating 50%, followup 20%
        const qualityScore = Math.round(
          (durationScore * 0.3) + (ratingScore * 0.5) + (followupScore * 0.2)
        );

        return {
          sessionId: session.id,
          qualityScore,
          durationScore: Math.round(durationScore),
          ratingScore: Math.round(ratingScore),
          followupScore,
          title: session.title,
          scheduledAt: session.scheduled_at
        };
      }) || [];

      return qualityScores.sort((a, b) => b.qualityScore - a.qualityScore);
    },
    enabled: !!user
  });
};

export const useAdvisorSessionMetrics = (advisorId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['advisor-session-metrics', advisorId],
    queryFn: async () => {
      if (!advisorId) return null;

      const { data: assignments, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          id, total_sessions, completed_sessions, avg_rating,
          founder:users!founder_id(email),
          sessions:sessions(
            id, status, founder_rating, advisor_rating, 
            scheduled_at, duration_minutes
          )
        `)
        .eq('advisor_id', advisorId)
        .is('deleted_at', null);

      if (error) throw error;

      return assignments?.map(assignment => ({
        assignmentId: assignment.id,
        founderEmail: assignment.founder?.email,
        totalSessions: assignment.total_sessions || 0,
        completedSessions: assignment.completed_sessions || 0,
        avgRating: assignment.avg_rating || 0,
        recentSessions: assignment.sessions?.slice(0, 5) || []
      })) || [];
    },
    enabled: !!user && !!advisorId
  });
};
