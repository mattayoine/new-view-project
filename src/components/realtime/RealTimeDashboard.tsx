
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Activity } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useRealTimeSubscription } from '@/hooks/useRealTimeSubscription';
import { EnhancedLoadingState } from '@/components/ui/enhanced-loading';
import { toast } from 'sonner';

interface ConnectionStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  reconnectAttempts: number;
}

export const RealTimeDashboard: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    lastUpdate: new Date(),
    reconnectAttempts: 0
  });
  
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
    refreshMetrics
  } = useDashboardMetrics();

  // Subscribe to real-time updates for all relevant tables
  const tablesWithRealtime = [
    'sessions',
    'advisor_founder_assignments', 
    'base_applications',
    'notifications'
  ];

  tablesWithRealtime.forEach(table => {
    useRealTimeSubscription({
      table,
      queryKey: ['dashboard-metrics'],
      event: '*'
    });
  });

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        reconnectAttempts: 0
      }));
      toast.success('Connection restored');
      refetch();
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false
      }));
      toast.error('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch]);

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus.isConnected) {
        refreshMetrics();
        setConnectionStatus(prev => ({
          ...prev,
          lastUpdate: new Date()
        }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionStatus.isConnected, refreshMetrics]);

  const handleManualRefresh = async () => {
    try {
      await refetch();
      await refreshMetrics();
      setConnectionStatus(prev => ({
        ...prev,
        lastUpdate: new Date()
      }));
      toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    }
  };

  if (isLoading) {
    return <EnhancedLoadingState type="cards" count={4} message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <p className="text-destructive mb-4">Failed to load dashboard metrics</p>
          <Button onClick={handleManualRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectionStatus.isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <Badge variant={connectionStatus.isConnected ? 'default' : 'destructive'}>
                Real-time
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              {connectionStatus.lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Last update: {connectionStatus.lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <Button 
                onClick={handleManualRefresh} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Sessions"
          value={metrics?.activeSessions || 0}
          icon={<Activity className="w-4 h-4" />}
          trend="+12%"
          isPositive={true}
        />
        
        <MetricCard
          title="Pending Applications"
          value={metrics?.pendingApplications || 0}
          icon={<Activity className="w-4 h-4" />}
          trend="-5%"
          isPositive={true}
        />
        
        <MetricCard
          title="Total Assignments"
          value={metrics?.totalAssignments || 0}
          icon={<Activity className="w-4 h-4" />}
          trend="+8%"
          isPositive={true}
        />
        
        <MetricCard
          title="Unread Notifications"
          value={metrics?.unreadNotifications || 0}
          icon={<Activity className="w-4 h-4" />}
          trend="0%"
          isPositive={null}
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  isPositive?: boolean | null;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  isPositive
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={
              isPositive === true ? 'text-green-600' : 
              isPositive === false ? 'text-red-600' : 
              'text-gray-600'
            }>
              {trend}
            </span>
            {' from last month'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
