
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

interface DashboardMetric {
  metric_type: string;
  count: number;
  user_id?: string;
}

export const useDashboardMetrics = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*');
      
      if (error) throw error;
      return data as DashboardMetric[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Subscribe to real-time updates for key tables that affect metrics
  useRealTimeSubscription({
    table: 'sessions',
    queryKey: ['dashboard-metrics', user?.id],
    event: '*'
  });

  useRealTimeSubscription({
    table: 'advisor_founder_assignments',
    queryKey: ['dashboard-metrics', user?.id],
    event: '*'
  });

  useRealTimeSubscription({
    table: 'base_applications',
    queryKey: ['dashboard-metrics', user?.id],
    event: '*'
  });

  const refreshMetrics = async () => {
    try {
      await supabase.rpc('refresh_dashboard_metrics');
      query.refetch();
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    }
  };

  const getMetricValue = (metricType: string, userId?: string) => {
    const metric = query.data?.find(m => 
      m.metric_type === metricType && 
      (userId ? m.user_id === userId : !m.user_id)
    );
    return metric?.count || 0;
  };

  return {
    ...query,
    refreshMetrics,
    getMetricValue,
    metrics: {
      activeSessions: getMetricValue('active_sessions'),
      pendingApplications: getMetricValue('pending_applications'),
      totalAssignments: getMetricValue('total_assignments'),
      unreadNotifications: getMetricValue('unread_notifications', user?.id)
    }
  };
};
