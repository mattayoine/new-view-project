
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface PerformanceMetrics {
  dataLoadTime: number;
  renderTime: number;
  errorCount: number;
  successfulOperations: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export const usePerformanceAnalytics = () => {
  const { userProfile } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    dataLoadTime: 0,
    renderTime: 0,
    errorCount: 0,
    successfulOperations: 0,
    averageResponseTime: 0,
    lastUpdated: new Date()
  });

  const [performanceLog, setPerformanceLog] = useState<Array<{
    timestamp: Date;
    operation: string;
    duration: number;
    success: boolean;
  }>>([]);

  const trackOperation = useCallback((operation: string, duration: number, success: boolean) => {
    const logEntry = {
      timestamp: new Date(),
      operation,
      duration,
      success
    };

    setPerformanceLog(prev => [...prev.slice(-99), logEntry]); // Keep last 100 entries

    setMetrics(prev => ({
      ...prev,
      errorCount: success ? prev.errorCount : prev.errorCount + 1,
      successfulOperations: success ? prev.successfulOperations + 1 : prev.successfulOperations,
      averageResponseTime: (prev.averageResponseTime + duration) / 2,
      lastUpdated: new Date()
    }));
  }, []);

  const measurePerformance = useCallback((operationName: string) => {
    const startTime = performance.now();
    
    return {
      end: (success: boolean = true) => {
        const duration = performance.now() - startTime;
        trackOperation(operationName, duration, success);
        return duration;
      }
    };
  }, [trackOperation]);

  // Track page load performance
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          setMetrics(prev => ({
            ...prev,
            dataLoadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            lastUpdated: new Date()
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);

  const getPerformanceInsights = useCallback(() => {
    const recentErrors = performanceLog.filter(log => 
      !log.success && 
      Date.now() - log.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    const averageLoadTime = performanceLog
      .filter(log => log.operation.includes('load'))
      .reduce((sum, log) => sum + log.duration, 0) / 
      performanceLog.filter(log => log.operation.includes('load')).length || 0;

    return {
      errorRate: (metrics.errorCount / (metrics.errorCount + metrics.successfulOperations)) * 100,
      recentErrorCount: recentErrors.length,
      averageLoadTime,
      performanceGrade: averageLoadTime < 1000 ? 'A' : averageLoadTime < 2000 ? 'B' : 'C',
      recommendations: [
        ...(averageLoadTime > 2000 ? ['Consider optimizing data fetching'] : []),
        ...(recentErrors.length > 3 ? ['Multiple recent errors detected'] : []),
        ...(metrics.errorCount > 10 ? ['High error count - investigate issues'] : [])
      ]
    };
  }, [metrics, performanceLog]);

  return {
    metrics,
    performanceLog: performanceLog.slice(-10), // Return last 10 entries
    measurePerformance,
    trackOperation,
    insights: getPerformanceInsights()
  };
};
