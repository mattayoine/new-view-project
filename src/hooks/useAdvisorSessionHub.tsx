
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export interface AdvisorSessionHubData {
  sessionPortfolio: SessionPortfolioItem[];
  upcomingPreparations: SessionPreparation[];
  performanceMetrics: AdvisorPerformanceMetrics;
  resourceLibrary: ResourceItem[];
}

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

export interface SessionPreparation {
  sessionId: string;
  founderId: string;
  founderName: string;
  scheduledAt: string;
  title: string;
  suggestedAgenda: string[];
  relevantGoals: string[];
  previousNotes: string;
  recommendedResources: string[];
  preparationStatus: 'not_started' | 'in_progress' | 'completed';
}

export interface AdvisorPerformanceMetrics {
  totalFounders: number;
  activeSessions: number;
  completedSessions: number;
  avgSessionRating: number;
  avgFounderSatisfaction: number;
  monthlyTrends: {
    month: string;
    sessions: number;
    satisfaction: number;
    completionRate: number;
  }[];
  improvementAreas: string[];
  strengths: string[];
}

export interface ResourceItem {
  id: string;
  title: string;
  type: 'template' | 'guide' | 'methodology' | 'tool';
  category: string;
  description: string;
  url?: string;
  content?: string;
  tags: string[];
  usageCount: number;
  rating: number;
}

export const useAdvisorSessionHub = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['advisor-session-hub', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get advisor's users table ID
      const { data: advisor, error: advisorError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .eq('role', 'advisor')
        .single();

      if (advisorError) throw advisorError;

      // Get session portfolio data
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

      // Get upcoming sessions for preparation
      const { data: upcomingSessions, error: upcomingError } = await supabase
        .from('sessions')
        .select(`
          id, title, scheduled_at, description, preparation_notes,
          assignment:advisor_founder_assignments!assignment_id(
            founder:users!founder_id(id, email),
            goals:goals(title, description, status, progress_percentage)
          )
        `)
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled')
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (upcomingError) throw upcomingError;

      // Get resource library
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .eq('access_level', 'advisor')
        .is('deleted_at', null)
        .order('view_count', { ascending: false });

      if (resourcesError) throw resourcesError;

      // Process session portfolio
      const sessionPortfolio: SessionPortfolioItem[] = assignments?.map(assignment => {
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
          status: 'active',
          urgentActions: [],
          overallProgress: 75, // Placeholder
          avgRating: Math.round(avgRating * 10) / 10
        };
      }) || [];

      // Process upcoming preparations
      const upcomingPreparations: SessionPreparation[] = upcomingSessions?.map(session => ({
        sessionId: session.id,
        founderId: session.assignment?.founder?.id || '',
        founderName: session.assignment?.founder?.email || 'Unknown',
        scheduledAt: session.scheduled_at,
        title: session.title,
        suggestedAgenda: [
          'Review previous action items',
          'Discuss current challenges',
          'Set next milestones'
        ],
        relevantGoals: session.assignment?.goals?.map(g => g.title) || [],
        previousNotes: session.preparation_notes || '',
        recommendedResources: [],
        preparationStatus: 'not_started'
      })) || [];

      // Calculate performance metrics
      const performanceMetrics: AdvisorPerformanceMetrics = {
        totalFounders: assignments?.length || 0,
        activeSessions: upcomingSessions?.length || 0,
        completedSessions: assignments?.reduce((sum, a) => sum + (a.completed_sessions || 0), 0) || 0,
        avgSessionRating: assignments?.reduce((sum, a) => sum + (a.avg_rating || 0), 0) / (assignments?.length || 1) || 0,
        avgFounderSatisfaction: 4.2, // Placeholder
        monthlyTrends: [], // Placeholder
        improvementAreas: ['Time management', 'Follow-up consistency'],
        strengths: ['Technical expertise', 'Problem-solving approach']
      };

      return {
        sessionPortfolio,
        upcomingPreparations,
        performanceMetrics,
        resourceLibrary: resources || []
      };
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  // Subscribe to real-time updates
  useRealTimeSubscription({
    table: 'sessions',
    queryKey: ['advisor-session-hub', user?.id],
    event: '*'
  });

  return query;
};

export const useSessionPlanningWizard = () => {
  return {
    generateAgenda: async (sessionType: string, founderGoals: string[], previousNotes: string) => {
      // Placeholder for AI-powered agenda generation
      const baseAgenda = [
        'Welcome and check-in',
        'Review previous action items',
        'Discuss current challenges',
        'Work on specific goals',
        'Define next steps',
        'Schedule follow-up'
      ];

      return baseAgenda;
    },

    getSessionTemplates: async (category: string) => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('type', 'template')
        .eq('category', category)
        .is('deleted_at', null);

      if (error) throw error;
      return data || [];
    }
  };
};
