
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import { useJourneyMonitoring } from '@/hooks/useJourneyMonitoring';
import { useSystemHealthCheck } from '@/hooks/useSystemHealthCheck';
import { StatusIndicator } from '@/components/ui/enhanced-transitions';

export const SystemMonitor: React.FC = () => {
  const { insights, metrics } = usePerformanceAnalytics();
  const { isOnline, isConnected, queuedOperationsCount } = useJourneyMonitoring();
  const { healthCheck, isRunning } = useSystemHealthCheck();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatLastRefresh = () => {
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Status
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Updated {formatLastRefresh()}
            {isRunning && <RefreshCw className="w-4 h-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isOnline && isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <div>
                <div className="text-sm font-medium">Connection</div>
                <div className="text-xs text-muted-foreground">
                  {isOnline && isConnected ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="flex items-center gap-2">
              <CheckCircle className={cn('w-4 h-4', getHealthColor(healthCheck.overallHealth))} />
              <div>
                <div className="text-sm font-medium">Health</div>
                <div className={cn('text-xs font-medium', getHealthColor(healthCheck.overallHealth))}>
                  {healthCheck.overallHealth}%
                </div>
              </div>
            </div>

            {/* Performance Grade */}
            <div className="flex items-center gap-2">
              {insights.performanceGrade === 'A' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-yellow-500" />
              )}
              <div>
                <div className="text-sm font-medium">Performance</div>
                <div className="text-xs text-muted-foreground">
                  Grade {insights.performanceGrade}
                </div>
              </div>
            </div>

            {/* Queue Status */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Queue</div>
                <div className="text-xs text-muted-foreground">
                  {queuedOperationsCount} pending
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Load Time</span>
                  <span>{insights.averageLoadTime.toFixed(0)}ms</span>
                </div>
                <Progress value={Math.min(100, (2000 - insights.averageLoadTime) / 20)} />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Error Rate</span>
                  <span>{insights.errorRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={100 - insights.errorRate} 
                  className={insights.errorRate > 5 ? 'bg-red-100' : ''} 
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Success Rate</span>
                  <span>{(100 - insights.errorRate).toFixed(1)}%</span>
                </div>
                <Progress value={100 - insights.errorRate} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Issues & Recommendations */}
      {(healthCheck.issues.length > 0 || insights.recommendations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Issues & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthCheck.issues.map((issue, index) => (
                <StatusIndicator
                  key={index}
                  status="warning"
                  message={issue}
                />
              ))}
              
              {insights.recommendations.map((rec, index) => (
                <StatusIndicator
                  key={index}
                  status="info"
                  message={rec}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh App
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Clear Cache
            </Button>
            
            {queuedOperationsCount > 0 && (
              <Badge variant="secondary">
                {queuedOperationsCount} operations queued
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
