
import React, { Suspense } from 'react';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { EnhancedLoadingState } from '@/components/ui/enhanced-loading';
import { RealTimeDashboard } from '@/components/realtime/RealTimeDashboard';
import { RealTimeNotifications } from '@/components/notifications/RealTimeNotifications';
import { JourneyStatusIndicator } from '@/components/journey/JourneyStatusIndicator';
import { ComprehensiveJourneyDashboard } from '@/components/journey/ComprehensiveJourneyDashboard';
import EnhancedSessionTracker from '@/components/admin/EnhancedSessionTracker';
import { useAuth } from '@/hooks/useAuth';

export const EnhancedDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <RealTimeNotifications />
      </div>

      {/* Status Indicator */}
      <JourneyStatusIndicator />

      {/* Main Dashboard Content */}
      <EnhancedErrorBoundary enableReporting showDetails>
        <Suspense fallback={<EnhancedLoadingState type="cards" count={1} />}>
          <ComprehensiveJourneyDashboard />
        </Suspense>
      </EnhancedErrorBoundary>

      {/* Real-time Metrics - Only for admin users */}
      {userProfile?.role === 'admin' && (
        <EnhancedErrorBoundary enableReporting showDetails>
          <Suspense fallback={<EnhancedLoadingState type="table" rows={5} columns={4} />}>
            <EnhancedSessionTracker />
          </Suspense>
        </EnhancedErrorBoundary>
      )}
    </div>
  );
};
