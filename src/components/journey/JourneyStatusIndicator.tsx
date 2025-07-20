
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useJourneyMonitoring } from '@/hooks/useJourneyMonitoring';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';

export const JourneyStatusIndicator: React.FC = () => {
  const { 
    journeyFlow, 
    isOnline, 
    isConnected, 
    queuedOperationsCount,
    isHealthy,
    connectionStatus 
  } = useJourneyMonitoring();
  
  const { insights } = usePerformanceAnalytics();

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (isConnected) return <Wifi className="w-4 h-4 text-green-500" />;
    return <Wifi className="w-4 h-4 text-yellow-500" />;
  };

  const getHealthIcon = () => {
    if (!journeyFlow) return <Clock className="w-4 h-4 text-gray-500" />;
    if (journeyFlow.healthScore >= 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (journeyFlow.healthScore >= 60) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const getPerformanceIcon = () => {
    if (insights.performanceGrade === 'A') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (insights.performanceGrade === 'B') return <Activity className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {getConnectionIcon()}
        <span className="text-sm capitalize">{connectionStatus}</span>
        {queuedOperationsCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {queuedOperationsCount} queued
          </Badge>
        )}
      </div>

      {/* Journey Health */}
      {journeyFlow && (
        <div className="flex items-center gap-2">
          {getHealthIcon()}
          <span className="text-sm">Health: {journeyFlow.healthScore}%</span>
          <Progress value={journeyFlow.healthScore} className="w-16 h-2" />
        </div>
      )}

      {/* Performance Status */}
      <div className="flex items-center gap-2">
        {getPerformanceIcon()}
        <span className="text-sm">Performance: {insights.performanceGrade}</span>
      </div>

      {/* Overall Progress */}
      {journeyFlow && (
        <div className="flex items-center gap-2">
          <span className="text-sm">Progress: {journeyFlow.overallProgress}%</span>
          <Progress value={journeyFlow.overallProgress} className="w-16 h-2" />
        </div>
      )}
    </div>
  );
};
