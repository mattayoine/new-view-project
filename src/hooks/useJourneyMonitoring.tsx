
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useEnhancedJourneyFlow } from './useEnhancedJourneyFlow';
import { useOptimizedDashboardData } from './useOptimizedDashboardData';
import { useOfflineSupport } from './useOfflineSupport';
import { useRealTimeJourneyUpdates } from './useRealTimeJourneyUpdates';
import { toast } from 'sonner';

export const useJourneyMonitoring = () => {
  const { userProfile } = useAuth();
  const { data: journeyFlow } = useEnhancedJourneyFlow();
  const { data: dashboardData } = useOptimizedDashboardData();
  const { isOnline, queuedOperationsCount } = useOfflineSupport();
  const { isConnected } = useRealTimeJourneyUpdates();
  const queryClient = useQueryClient();

  // Health score monitoring
  useEffect(() => {
    if (journeyFlow?.healthScore && journeyFlow.healthScore < 50) {
      toast.warning('Your journey health score is low. Consider taking action to improve it.');
    }
  }, [journeyFlow?.healthScore]);

  // Offline/online status monitoring
  useEffect(() => {
    if (!isOnline) {
      toast.info('You are offline. Changes will sync when connection is restored.');
    } else if (queuedOperationsCount > 0) {
      toast.success(`Connection restored. Syncing ${queuedOperationsCount} pending operations...`);
    }
  }, [isOnline, queuedOperationsCount]);

  // Journey completion monitoring
  useEffect(() => {
    if (journeyFlow?.overallProgress === 100) {
      toast.success('Congratulations! Your journey is complete.');
    }
  }, [journeyFlow?.overallProgress]);

  // Data refresh coordination
  const refreshAllData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['enhanced-journey-flow'] });
    queryClient.invalidateQueries({ queryKey: ['optimized-dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['user-journey-status'] });
  }, [queryClient]);

  return {
    journeyFlow,
    dashboardData,
    isOnline,
    isConnected,
    queuedOperationsCount,
    refreshAllData,
    // Computed states
    isHealthy: journeyFlow?.healthScore ? journeyFlow.healthScore >= 80 : false,
    isComplete: journeyFlow?.overallProgress === 100,
    hasNextAction: !!journeyFlow?.nextStepAction,
    connectionStatus: isOnline ? (isConnected ? 'connected' : 'online') : 'offline'
  };
};
