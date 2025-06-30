
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export interface SessionHealthMetrics {
  totalActiveSessions: number;
  sessionsAtRisk: number;
  overdueFollowups: number;
  interventionNeeded: number;
  avgHealthScore: number;
}

export interface SessionAlert {
  id: string;
  type: 'cancellation_risk' | 'declining_scores' | 'missed_commitments' | 'overdue_followup';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
  assignmentId: string;
  title: string;
  description: string;
  suggestedActions: string[];
  createdAt: string;
  founderName?: string;
  advisorName?: string;
}

export interface PerformanceLeader {
  userId: string;
  name: string;
  role: 'advisor' | 'founder';
  score: number;
  sessionsCompleted: number;
  avgRating: number;
  streak: number;
  badge: string;
}

export const useSessionMonitoring = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['session-monitoring'],
    queryFn: async () => {
      // Get comprehensive session data
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id, title, status, scheduled_at, founder_rating, advisor_rating,
          duration_minutes, created_at, updated_at,
          assignment:advisor_founder_assignments(
            id, advisor_id, founder_id,
            advisor:users!advisor_id(email),
            founder:users!founder_id(email)
          )
        `)
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Calculate health metrics
      const now = new Date();
      const healthMetrics = calculateHealthMetrics(sessions || []);
      
      // Generate alerts
      const alerts = generateSessionAlerts(sessions || []);
      
      // Calculate performance leaderboards
      const leaderboards = calculatePerformanceLeaderboards(sessions || []);

      return {
        sessions: sessions || [],
        healthMetrics,
        alerts,
        leaderboards
      };
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Subscribe to real-time updates
  useRealTimeSubscription({
    table: 'sessions',
    queryKey: ['session-monitoring'],
    event: '*'
  });

  return query;
};

function calculateHealthMetrics(sessions: any[]): SessionHealthMetrics {
  const now = new Date();
  const activeSessions = sessions.filter(s => 
    s.status === 'scheduled' && new Date(s.scheduled_at) > now
  );
  
  const sessionsAtRisk = sessions.filter(s => {
    const rating = ((s.founder_rating || 0) + (s.advisor_rating || 0)) / 2;
    return s.status === 'completed' && rating < 3;
  }).length;

  const overdueFollowups = sessions.filter(s => {
    const daysSinceSession = (now.getTime() - new Date(s.scheduled_at).getTime()) / (1000 * 60 * 60 * 24);
    return s.status === 'completed' && daysSinceSession > 7 && !s.ai_summary;
  }).length;

  const interventionNeeded = Math.floor(sessionsAtRisk * 0.3 + overdueFollowups * 0.5);

  const avgHealthScore = Math.max(0, 100 - (sessionsAtRisk * 2) - (overdueFollowups * 3));

  return {
    totalActiveSessions: activeSessions.length,
    sessionsAtRisk,
    overdueFollowups,
    interventionNeeded,
    avgHealthScore: Math.round(avgHealthScore)
  };
}

function generateSessionAlerts(sessions: any[]): SessionAlert[] {
  const alerts: SessionAlert[] = [];
  const now = new Date();

  sessions.forEach(session => {
    // Check for cancellation risk
    if (session.status === 'scheduled') {
      const hoursUntilSession = (new Date(session.scheduled_at).getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilSession < 24 && hoursUntilSession > 0) {
        alerts.push({
          id: `alert-${session.id}-cancellation`,
          type: 'cancellation_risk',
          severity: 'medium',
          sessionId: session.id,
          assignmentId: session.assignment?.id || '',
          title: 'Session Starting Soon',
          description: `Session "${session.title}" starts in ${Math.round(hoursUntilSession)} hours`,
          suggestedActions: ['Send reminder', 'Confirm attendance', 'Check preparation status'],
          createdAt: now.toISOString(),
          founderName: session.assignment?.founder?.email,
          advisorName: session.assignment?.advisor?.email
        });
      }
    }

    // Check for declining scores
    const avgRating = ((session.founder_rating || 0) + (session.advisor_rating || 0)) / 2;
    if (session.status === 'completed' && avgRating > 0 && avgRating < 3) {
      alerts.push({
        id: `alert-${session.id}-declining`,
        type: 'declining_scores',
        severity: 'high',
        sessionId: session.id,
        assignmentId: session.assignment?.id || '',
        title: 'Low Session Rating',
        description: `Session received ${avgRating.toFixed(1)}/5 rating`,
        suggestedActions: ['Review feedback', 'Schedule follow-up', 'Consider reassignment'],
        createdAt: now.toISOString(),
        founderName: session.assignment?.founder?.email,
        advisorName: session.assignment?.advisor?.email
      });
    }

    // Check for overdue follow-ups
    if (session.status === 'completed') {
      const daysSince = (now.getTime() - new Date(session.scheduled_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7 && !session.ai_summary) {
        alerts.push({
          id: `alert-${session.id}-overdue`,
          type: 'overdue_followup',
          severity: 'medium',
          sessionId: session.id,
          assignmentId: session.assignment?.id || '',
          title: 'Overdue Follow-up',
          description: `Session completed ${Math.round(daysSince)} days ago without follow-up`,
          suggestedActions: ['Generate summary', 'Extract action items', 'Schedule next session'],
          createdAt: now.toISOString(),
          founderName: session.assignment?.founder?.email,
          advisorName: session.assignment?.advisor?.email
        });
      }
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

function calculatePerformanceLeaderboards(sessions: any[]): {
  topAdvisors: PerformanceLeader[];
  topFounders: PerformanceLeader[];
} {
  const advisorStats = new Map();
  const founderStats = new Map();

  sessions.filter(s => s.status === 'completed').forEach(session => {
    const advisorId = session.assignment?.advisor_id;
    const founderId = session.assignment?.founder_id;
    const avgRating = ((session.founder_rating || 0) + (session.advisor_rating || 0)) / 2;

    if (advisorId) {
      const existing = advisorStats.get(advisorId) || { 
        sessions: 0, totalRating: 0, name: session.assignment?.advisor?.email || 'Unknown' 
      };
      existing.sessions++;
      existing.totalRating += avgRating;
      advisorStats.set(advisorId, existing);
    }

    if (founderId) {
      const existing = founderStats.get(founderId) || { 
        sessions: 0, totalRating: 0, name: session.assignment?.founder?.email || 'Unknown' 
      };
      existing.sessions++;
      existing.totalRating += avgRating;
      founderStats.set(founderId, existing);
    }
  });

  const createLeaderboard = (statsMap: Map<string, any>, role: 'advisor' | 'founder'): PerformanceLeader[] => {
    return Array.from(statsMap.entries())
      .map(([userId, stats]) => ({
        userId,
        name: stats.name,
        role,
        score: Math.round((stats.totalRating / stats.sessions) * 20 + stats.sessions * 2),
        sessionsCompleted: stats.sessions,
        avgRating: Math.round((stats.totalRating / stats.sessions) * 10) / 10,
        streak: Math.min(stats.sessions, 10),
        badge: stats.sessions > 10 ? 'gold' : stats.sessions > 5 ? 'silver' : 'bronze'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  };

  return {
    topAdvisors: createLeaderboard(advisorStats, 'advisor'),
    topFounders: createLeaderboard(founderStats, 'founder')
  };
}

export const useSessionInterventions = () => {
  return {
    rescheduleSession: async (sessionId: string, newTime: string) => {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          scheduled_at: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    },

    reassignAdvisor: async (assignmentId: string, newAdvisorId: string) => {
      const { error } = await supabase
        .from('advisor_founder_assignments')
        .update({ 
          advisor_id: newAdvisorId,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },

    markForMediation: async (assignmentId: string, notes: string) => {
      const { error } = await supabase
        .from('advisor_founder_assignments')
        .update({ 
          status: 'mediation_required',
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
    }
  };
};
