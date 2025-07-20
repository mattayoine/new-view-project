
import React, { Suspense } from 'react';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { EnhancedLoadingState } from '@/components/ui/enhanced-loading';
import { LoadingOverlay } from '@/components/ui/loading-animation';
import { PageTransition } from '@/components/animations/PageTransitions';
import { RealTimeDashboard } from '@/components/realtime/RealTimeDashboard';
import { RealTimeNotifications } from '@/components/notifications/RealTimeNotifications';
import { JourneyStatusIndicator } from '@/components/journey/JourneyStatusIndicator';
import { ComprehensiveJourneyDashboard } from '@/components/journey/ComprehensiveJourneyDashboard';
import { E2ETestRunner } from '@/components/testing/E2ETestRunner';
import { SystemMonitor } from '@/components/monitoring/SystemMonitor';
import { DeploymentChecker } from '@/components/deployment/DeploymentChecker';
import EnhancedSessionTracker from '@/components/admin/EnhancedSessionTracker';
import { useAuth } from '@/hooks/useAuth';
import { useSystemHealthCheck } from '@/hooks/useSystemHealthCheck';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const EnhancedDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { healthCheck, isRunning } = useSystemHealthCheck();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <PageTransition>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <RealTimeNotifications />
        </div>

        {/* Status Indicator */}
        <JourneyStatusIndicator />

        {/* Admin Controls */}
        {(isDevelopment || isAdmin) && (
          <Tabs defaultValue="testing" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="testing">
              <EnhancedErrorBoundary enableReporting showDetails>
                <Suspense fallback={<EnhancedLoadingState type="cards" count={1} />}>
                  <E2ETestRunner />
                </Suspense>
              </EnhancedErrorBoundary>
            </TabsContent>
            
            <TabsContent value="monitoring">
              <EnhancedErrorBoundary enableReporting showDetails>
                <Suspense fallback={<EnhancedLoadingState type="cards" count={2} />}>
                  <SystemMonitor />
                </Suspense>
              </EnhancedErrorBoundary>
            </TabsContent>
            
            <TabsContent value="deployment">
              <EnhancedErrorBoundary enableReporting showDetails>
                <Suspense fallback={<EnhancedLoadingState type="cards" count={1} />}>
                  <DeploymentChecker />
                </Suspense>
              </EnhancedErrorBoundary>
            </TabsContent>
          </Tabs>
        )}

        {/* Main Dashboard Content */}
        <EnhancedErrorBoundary 
          enableReporting 
          showDetails
          onError={(error, errorInfo) => {
            console.error('Dashboard Error:', error, errorInfo);
          }}
        >
          <LoadingOverlay isLoading={isRunning} message="Checking system health...">
            <Suspense fallback={<EnhancedLoadingState type="cards" count={1} />}>
              <ComprehensiveJourneyDashboard />
            </Suspense>
          </LoadingOverlay>
        </EnhancedErrorBoundary>

        {/* Real-time Metrics Dashboard */}
        <EnhancedErrorBoundary enableReporting showDetails>
          <Suspense fallback={<EnhancedLoadingState type="cards" count={2} />}>
            <RealTimeDashboard />
          </Suspense>
        </EnhancedErrorBoundary>

        {/* Admin Session Tracker - Only for admin users */}
        {isAdmin && (
          <EnhancedErrorBoundary enableReporting showDetails>
            <Suspense fallback={<EnhancedLoadingState type="table" rows={5} columns={4} />}>
              <EnhancedSessionTracker />
            </Suspense>
          </EnhancedErrorBoundary>
        )}

        {/* System Health Status (Development only) */}
        {isDevelopment && healthCheck && (
          <div className="mt-8 text-xs text-muted-foreground">
            <details>
              <summary className="cursor-pointer">System Health Check Results</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(healthCheck, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
