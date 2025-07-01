
import { useSessionPortfolio } from './useSessionPortfolio';
import { useSessionPreparation } from './useSessionPreparation';
import { useAdvisorPerformance } from './useAdvisorPerformance';
import { useRealTimeSubscription } from './useRealTimeSubscription';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type { SessionPortfolioItem } from './useSessionPortfolio';
export type { SessionPreparation } from './useSessionPreparation';
export type { AdvisorPerformanceMetrics } from './useAdvisorPerformance';

export interface ResourceItem {
  id: string;
  title: string;
  type: string;
  description: string | null;
  access_level: string;
  file_path: string | null;
  file_url: string | null;
  shared_by: string | null;
  category_id: string | null;
  view_count: number;
  download_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AdvisorSessionHubData {
  sessionPortfolio: import('./useSessionPortfolio').SessionPortfolioItem[];
  upcomingPreparations: import('./useSessionPreparation').SessionPreparation[];
  performanceMetrics: import('./useAdvisorPerformance').AdvisorPerformanceMetrics;
  resourceLibrary: ResourceItem[];
}

export const useAdvisorSessionHub = () => {
  const { user } = useAuth();
  const portfolioQuery = useSessionPortfolio();
  const preparationQuery = useSessionPreparation();
  
  const resourceQuery = useQuery({
    queryKey: ['advisor-resources', user?.id],
    queryFn: async () => {
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .eq('access_level', 'advisor')
        .is('deleted_at', null)
        .order('view_count', { ascending: false });

      if (resourcesError) throw resourcesError;
      return resources || [];
    },
    enabled: !!user
  });

  const performanceQuery = useAdvisorPerformance(
    portfolioQuery.data || [], 
    preparationQuery.data || []
  );

  // Subscribe to real-time updates
  useRealTimeSubscription({
    table: 'sessions',
    queryKey: ['advisor-session-hub', user?.id],
    event: '*'
  });

  const isLoading = portfolioQuery.isLoading || preparationQuery.isLoading || 
                   resourceQuery.isLoading || performanceQuery.isLoading;
  
  const error = portfolioQuery.error || preparationQuery.error || 
               resourceQuery.error || performanceQuery.error;

  const data: AdvisorSessionHubData | undefined = (
    portfolioQuery.data && 
    preparationQuery.data && 
    resourceQuery.data && 
    performanceQuery.data
  ) ? {
    sessionPortfolio: portfolioQuery.data,
    upcomingPreparations: preparationQuery.data,
    performanceMetrics: performanceQuery.data,
    resourceLibrary: resourceQuery.data
  } : undefined;

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      portfolioQuery.refetch();
      preparationQuery.refetch();
      resourceQuery.refetch();
      performanceQuery.refetch();
    }
  };
};

export const useSessionPlanningWizard = () => {
  return {
    generateAgenda: async (sessionType: string, founderGoals: string[], previousNotes: string) => {
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
        .eq('access_level', 'advisor')
        .is('deleted_at', null);

      if (error) throw error;
      return data || [];
    }
  };
};
