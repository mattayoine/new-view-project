
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useEnhancedJourneyFlow } from './useEnhancedJourneyFlow';
import { useOptimizedDashboardData } from './useOptimizedDashboardData';
import { useOfflineSupport } from './useOfflineSupport';
import { useRealTimeJourneyUpdates } from './useRealTimeJourneyUpdates';
import { usePerformanceAnalytics } from './usePerformanceAnalytics';

interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    auth: 'healthy' | 'warning' | 'critical';
    journeyFlow: 'healthy' | 'warning' | 'critical';
    dashboard: 'healthy' | 'warning' | 'critical';
    realtime: 'healthy' | 'warning' | 'critical';
    offline: 'healthy' | 'warning' | 'critical';
    performance: 'healthy' | 'warning' | 'critical';
  };
  issues: string[];
  recommendations: string[];
}

interface SystemHealthCheckResult {
  healthCheck: SystemHealthStatus;
  isRunning: boolean;
}

export const useSystemHealthCheck = (): SystemHealthCheckResult => {
  const { user, userProfile, isAuthenticated } = useAuth();
  const { data: journeyFlow, error: journeyError } = useEnhancedJourneyFlow();
  const { data: dashboardData, error: dashboardError } = useOptimizedDashboardData();
  const { isOnline, queuedOperationsCount } = useOfflineSupport();
  const { isConnected } = useRealTimeJourneyUpdates();
  const { insights } = usePerformanceAnalytics();

  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus>({
    overall: 'healthy',
    components: {
      auth: 'healthy',
      journeyFlow: 'healthy',
      dashboard: 'healthy',
      realtime: 'healthy',
      offline: 'healthy',
      performance: 'healthy'
    },
    issues: [],
    recommendations: []
  });

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setIsRunning(true);
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Auth Component
    const authStatus = isAuthenticated && user && userProfile ? 'healthy' : 'critical';
    if (authStatus === 'critical') {
      issues.push('Authentication not properly configured');
      recommendations.push('Ensure user authentication is working correctly');
    }

    // Check Journey Flow Component
    const journeyStatus = journeyError ? 'critical' : journeyFlow ? 'healthy' : 'warning';
    if (journeyStatus === 'critical') {
      issues.push('Journey flow data cannot be loaded');
      recommendations.push('Check journey flow hooks and data sources');
    }

    // Check Dashboard Component
    const dashboardStatus = dashboardError ? 'critical' : dashboardData ? 'healthy' : 'warning';
    if (dashboardStatus === 'critical') {
      issues.push('Dashboard data cannot be loaded');
      recommendations.push('Verify dashboard data fetching logic');
    }

    // Check Realtime Component
    const realtimeStatus = isOnline ? (isConnected ? 'healthy' : 'warning') : 'critical';
    if (realtimeStatus === 'critical') {
      issues.push('No internet connection');
      recommendations.push('Check network connectivity');
    } else if (realtimeStatus === 'warning') {
      issues.push('Real-time updates not connected');
      recommendations.push('Verify real-time subscription configuration');
    }

    // Check Offline Support
    const offlineStatus = queuedOperationsCount > 10 ? 'warning' : 'healthy';
    if (offlineStatus === 'warning') {
      issues.push(`${queuedOperationsCount} operations queued for sync`);
      recommendations.push('Monitor offline operation queue');
    }

    // Check Performance
    const performanceStatus = insights.performanceGrade === 'A' ? 'healthy' : 
                            insights.performanceGrade === 'B' ? 'warning' : 'critical';
    if (performanceStatus === 'critical') {
      issues.push('Poor system performance detected');
      recommendations.push('Optimize data fetching and rendering');
    }

    // Determine overall status
    const criticalCount = Object.values({
      auth: authStatus,
      journeyFlow: journeyStatus,
      dashboard: dashboardStatus,
      realtime: realtimeStatus,
      offline: offlineStatus,
      performance: performanceStatus
    }).filter(status => status === 'critical').length;

    const warningCount = Object.values({
      auth: authStatus,
      journeyFlow: journeyStatus,
      dashboard: dashboardStatus,
      realtime: realtimeStatus,
      offline: offlineStatus,
      performance: performanceStatus
    }).filter(status => status === 'warning').length;

    const overall = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

    setHealthStatus({
      overall,
      components: {
        auth: authStatus,
        journeyFlow: journeyStatus,
        dashboard: dashboardStatus,
        realtime: realtimeStatus,
        offline: offlineStatus,
        performance: performanceStatus
      },
      issues,
      recommendations
    });

    setIsRunning(false);
  }, [
    isAuthenticated, user, userProfile, journeyFlow, journeyError, 
    dashboardData, dashboardError, isOnline, isConnected, 
    queuedOperationsCount, insights
  ]);

  return { healthCheck: healthStatus, isRunning };
};
