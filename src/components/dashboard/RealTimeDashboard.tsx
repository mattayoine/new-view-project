
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Target, TrendingUp, Users, Star } from 'lucide-react';
import { useActualDashboardMetrics } from '@/hooks/useActualDashboardMetrics';
import { useRealTimeDashboard } from '@/hooks/useRealTimeDashboard';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useAuth } from '@/hooks/useAuth';

const RealTimeDashboard = () => {
  const { userProfile } = useAuth();
  const { data: metrics, isLoading } = useActualDashboardMetrics();
  const { unreadCount, markAllAsRead } = useRealTimeNotifications();
  
  // Initialize real-time connections
  useRealTimeDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const metricCards = [
    {
      title: 'Active Sessions',
      value: metrics.totalSessions,
      subtitle: `${metrics.completedSessions} completed`,
      icon: Calendar,
      trend: metrics.responseRate > 80 ? 'up' : metrics.responseRate > 50 ? 'stable' : 'down',
      color: 'text-blue-600'
    },
    {
      title: 'Upcoming Sessions',
      value: metrics.upcomingSessions,
      subtitle: 'This month',
      icon: Clock,
      trend: 'up',
      color: 'text-green-600'
    },
    {
      title: 'Active Assignments',
      value: metrics.activeAssignments,
      subtitle: `${metrics.matchingScore}% avg match`,
      icon: Users,
      trend: 'stable',
      color: 'text-purple-600'
    },
    {
      title: 'Average Rating',
      value: metrics.averageRating.toFixed(1),
      subtitle: `${metrics.responseRate}% response rate`,
      icon: Star,
      trend: metrics.averageRating >= 4 ? 'up' : 'stable',
      color: 'text-yellow-600'
    }
  ];

  // Add goals for founders
  if (userProfile?.role === 'founder') {
    metricCards.push({
      title: 'Active Goals',
      value: metrics.activeGoals,
      subtitle: `${metrics.completedGoals} completed`,
      icon: Target,
      trend: metrics.activeGoals > 0 ? 'up' : 'stable',
      color: 'text-indigo-600'
    });
  }

  return (
    <div className="space-y-6">
      {/* Notifications Banner */}
      {unreadCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-blue-700">
                    Stay updated with your latest activities and matches
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Mark all as read
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <IconComponent className={`w-4 h-4 ${metric.color}`} />
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={
                        metric.trend === 'up' ? 'bg-green-100 text-green-700' :
                        metric.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }
                    >
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : null}
                      {metric.trend}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {metric.subtitle}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Real-time Status */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live data - Updates in real-time</span>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
