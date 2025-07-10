
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetric {
  metric_name: string;
  metric_value: number;
  last_updated: string;
}

interface MetricsData {
  activeSessions: number;
  pendingApplications: number;
  totalAssignments: number;
  unreadNotifications: number;
  totalUsers: number;
  activeUsers: number;
  completedSessions: number;
}

export const useDashboardMetrics = () => {
  const queryResult = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetric[]> => {
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*');

      if (error) {
        console.error('Error fetching dashboard metrics:', error);
        throw error;
      }

      return data || [];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Process the raw metrics data into a structured format
  const processMetrics = (rawData: DashboardMetric[]): MetricsData => {
    const metricsMap = rawData.reduce((acc, metric) => {
      acc[metric.metric_name] = metric.metric_value;
      return acc;
    }, {} as Record<string, number>);

    return {
      activeSessions: metricsMap['active_sessions'] || 0,
      pendingApplications: metricsMap['pending_applications'] || 0,
      totalAssignments: metricsMap['total_assignments'] || 0,
      unreadNotifications: metricsMap['unread_notifications'] || 0,
      totalUsers: metricsMap['total_users'] || 0,
      activeUsers: metricsMap['active_users'] || 0,
      completedSessions: metricsMap['completed_sessions'] || 0,
    };
  };

  const refreshMetrics = async () => {
    // Refresh the materialized view
    try {
      await supabase.rpc('refresh_dashboard_metrics');
      await queryResult.refetch();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  };

  const metrics = queryResult.data ? processMetrics(queryResult.data) : {
    activeSessions: 0,
    pendingApplications: 0,
    totalAssignments: 0,
    unreadNotifications: 0,
    totalUsers: 0,
    activeUsers: 0,
    completedSessions: 0,
  };

  return {
    ...queryResult,
    metrics,
    refreshMetrics,
  };
};
