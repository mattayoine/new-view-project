
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Activity, TrendingUp, Users, Calendar, Clock } from 'lucide-react';
import { useOptimizedDashboardData } from '@/hooks/useOptimizedDashboardData';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';
import { useRealTimeJourneyUpdates } from '@/hooks/useRealTimeJourneyUpdates';
import { EnhancedLoadingState } from '@/components/ui/enhanced-loading';
import { toast } from 'sonner';

export const RealTimeDashboard: React.FC = () => {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useOptimizedDashboardData();
  
  const { isOnline, queuedOperationsCount } = useOfflineSupport();
  const { isConnected } = useRealTimeJourneyUpdates();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh every minute when online
  useEffect(() => {
    if (!isOnline) return;
    
    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [isOnline, refetch]);

  const handleManualRefresh = async () => {
    try {
      await refetch();
      setLastRefresh(new Date());
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
      {/* Enhanced Connection Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                
                {isConnected && isOnline && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Real-time
                  </Badge>
                )}
              </div>
              
              {queuedOperationsCount > 0 && (
                <Badge variant="secondary">
                  {queuedOperationsCount} pending sync
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                Last update: {lastRefresh.toLocaleTimeString()}
              </span>
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

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sessions"
          value={dashboardData.metrics.totalSessions}
          icon={<Calendar className="w-4 h-4" />}
          description="All time sessions"
          color="blue"
        />
        
        <MetricCard
          title="Completed Sessions"
          value={dashboardData.metrics.completedSessions}
          icon={<Activity className="w-4 h-4" />}
          description="Successfully completed"
          color="green"
        />
        
        <MetricCard
          title="Upcoming Sessions"
          value={dashboardData.metrics.upcomingSessions}
          icon={<Clock className="w-4 h-4" />}
          description="Scheduled ahead"
          color="orange"
        />
        
        <MetricCard
          title="Average Rating"
          value={dashboardData.metrics.averageRating}
          icon={<TrendingUp className="w-4 h-4" />}
          description="Session quality"
          color="purple"
          isDecimal
        />
      </div>

      {/* Recent Activity */}
      {dashboardData.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={`${activity.type}-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {activity.type === 'session' ? (
                      <Calendar className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Activity className="w-4 h-4 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{activity.status}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
  isDecimal?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  description,
  color = 'blue',
  isDecimal = false
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100', 
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isDecimal ? value.toFixed(1) : value.toLocaleString()}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
