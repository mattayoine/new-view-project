
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Wifi, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useSystemHealthCheck } from '@/hooks/useSystemHealthCheck';
import { useJourneyMonitoring } from '@/hooks/useJourneyMonitoring';
import { useSessionMonitoring } from '@/hooks/useSessionMonitoring';
import { cn } from '@/lib/utils';

export const SystemMonitor: React.FC = () => {
  const { healthCheck, isRunning } = useSystemHealthCheck();
  const { connectionStatus, isHealthy } = useJourneyMonitoring();
  const { data: sessionData } = useSessionMonitoring();

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isRunning) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Running system health check...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Health Monitor
            </CardTitle>
            <Badge 
              className={cn(
                'flex items-center gap-1',
                getHealthColor(healthCheck.overall)
              )}
            >
              {getHealthIcon(healthCheck.overall)}
              {healthCheck.overall}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Component Health Status */}
            {Object.entries(healthCheck.components).map(([component, status]) => (
              <div
                key={component}
                className={cn(
                  'p-3 rounded-lg border',
                  getHealthColor(status)
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">
                    {component.replace('_', ' ')}
                  </span>
                  {getHealthIcon(status)}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {status === 'healthy' ? 'Operating normally' : 'Needs attention'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Real-time Connection</p>
              <p className="text-sm text-muted-foreground">
                Status: {connectionStatus}
              </p>
            </div>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Session Metrics */}
      {sessionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Session Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>System Health Score</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={sessionData.healthMetrics?.avgHealthScore || 0} 
                    className="w-24" 
                  />
                  <span className="text-sm font-medium">
                    {sessionData.healthMetrics?.avgHealthScore || 0}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Active Sessions</p>
                  <p className="font-medium">
                    {sessionData.healthMetrics?.totalActiveSessions || 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sessions at Risk</p>
                  <p className="font-medium">
                    {sessionData.healthMetrics?.sessionsAtRisk || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues and Recommendations */}
      {healthCheck.issues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Issues Detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {healthCheck.issues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue}</li>
                ))}
              </ul>
              {healthCheck.recommendations.length > 0 && (
                <>
                  <p className="font-medium mt-3">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {healthCheck.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {isHealthy ? '✓' : '⚠'}
              </div>
              <div className="text-sm text-muted-foreground">Journey Health</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {connectionStatus === 'connected' ? '✓' : '⚠'}
              </div>
              <div className="text-sm text-muted-foreground">Real-time Status</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {healthCheck.overall === 'healthy' ? '✓' : '⚠'}
              </div>
              <div className="text-sm text-muted-foreground">System Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
