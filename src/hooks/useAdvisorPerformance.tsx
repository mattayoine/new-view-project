
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface MonthlyTrend {
  month: string;
  sessions: number;
  satisfaction: number;
  completionRate: number;
}

export interface AdvisorPerformanceMetrics {
  totalFounders: number;
  activeSessions: number;
  completedSessions: number;
  avgSessionRating: number;
  avgFounderSatisfaction: number;
  monthlyTrends: MonthlyTrend[];
  improvementAreas: string[];
  strengths: string[];
}

export const useAdvisorPerformance = (assignments: any[], upcomingSessions: any[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['advisor-performance', user?.id, assignments?.length, upcomingSessions?.length],
    queryFn: async () => {
      const performanceMetrics: AdvisorPerformanceMetrics = {
        totalFounders: assignments?.length || 0,
        activeSessions: upcomingSessions?.length || 0,
        completedSessions: assignments?.reduce((sum, a) => sum + (a.completed_sessions || 0), 0) || 0,
        avgSessionRating: assignments?.reduce((sum, a) => sum + (a.avg_rating || 0), 0) / (assignments?.length || 1) || 0,
        avgFounderSatisfaction: 4.2,
        monthlyTrends: [],
        improvementAreas: ['Time management', 'Follow-up consistency'],
        strengths: ['Technical expertise', 'Problem-solving approach']
      };

      return performanceMetrics;
    },
    enabled: !!user && !!assignments && !!upcomingSessions
  });
};
