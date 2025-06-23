
import React, { Suspense } from 'react';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { EnhancedLoadingState } from '@/components/ui/enhanced-loading';
import { RealTimeDashboard } from '@/components/realtime/RealTimeDashboard';
import { RealTimeNotifications } from '@/components/notifications/RealTimeNotifications';
import EnhancedSessionTracker from '@/components/admin/EnhancedSessionTracker';

export const EnhancedDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <RealTimeNotifications />
      </div>

      {/* Real-time Metrics */}
      <EnhancedErrorBoundary enableReporting showDetails>
        <Suspense fallback={<EnhancedLoadingState type="cards" count={4} />}>
          <RealTimeDashboard />
        </Suspense>
      </EnhancedErrorBoundary>

      {/* Enhanced Session Tracker */}
      <EnhancedErrorBoundary enableReporting showDetails>
        <Suspense fallback={<EnhancedLoadingState type="table" rows={5} columns={4} />}>
          <EnhancedSessionTracker />
        </Suspense>
      </EnhancedErrorBoundary>
    </div>
  );
};
