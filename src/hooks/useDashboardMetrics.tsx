
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetric {
  metric_name: string;
  metric_value: number;
  last_updated: string;
}

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetric[]> => {
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*');

      if (error) {
        console.error('Error fetching dashboard metrics:', error);
        throw error;
      }

      return data.map(item => ({
        metric_name: item.metric_name,
        metric_value: Number(item.metric_value),
        last_updated: item.last_updated
      }));
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
