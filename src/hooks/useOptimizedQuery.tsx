
import { useQuery, UseQueryOptions, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface QueryPerformanceMetrics {
  queryKey: string;
  executionTime: number;
  cacheHit: boolean;
  errorCount: number;
  timestamp: number;
}

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  enableCaching?: boolean;
  cacheDuration?: number;
  enableMetrics?: boolean;
  optimisticUpdates?: boolean;
  backgroundRefetch?: boolean;
}

// Global metrics store (in production, this would be sent to analytics)
const queryMetrics: QueryPerformanceMetrics[] = [];

export const useOptimizedQuery = <T,>({
  queryFn,
  enableCaching = true,
  cacheDuration = 5 * 60 * 1000, // 5 minutes default
  enableMetrics = true,
  optimisticUpdates = false,
  backgroundRefetch = true,
  ...queryOptions
}: OptimizedQueryOptions<T>) => {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState<QueryPerformanceMetrics | null>(null);
  
  const wrappedQueryFn = async () => {
    const startTime = performance.now();
    const queryKey = JSON.stringify(queryOptions.queryKey);
    
    try {
      // Check if data exists in cache
      const cachedData = queryClient.getQueryData(queryOptions.queryKey || []);
      const cacheHit = !!cachedData;
      
      const result = await queryFn();
      const executionTime = performance.now() - startTime;
      
      if (enableMetrics) {
        const metric: QueryPerformanceMetrics = {
          queryKey,
          executionTime,
          cacheHit,
          errorCount: 0,
          timestamp: Date.now()
        };
        
        queryMetrics.push(metric);
        setMetrics(metric);
        
        // Log slow queries (> 2 seconds)
        if (executionTime > 2000) {
          console.warn(`Slow query detected: ${queryKey} took ${executionTime}ms`);
        }
      }
      
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      if (enableMetrics) {
        const metric: QueryPerformanceMetrics = {
          queryKey,
          executionTime,
          cacheHit: false,
          errorCount: 1,
          timestamp: Date.now()
        };
        
        queryMetrics.push(metric);
        setMetrics(metric);
      }
      
      throw error;
    }
  };

  const query = useQuery({
    ...queryOptions,
    queryFn: wrappedQueryFn,
    staleTime: enableCaching ? cacheDuration : 0,
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnMount: !enableCaching,
    retry: (failureCount, error) => {
      // Custom retry logic
      if (failureCount >= 3) return false;
      
      // Don't retry for authentication errors
      if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
        return false;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorBoundary: true
    }
  });

  return {
    ...query,
    metrics,
    clearCache: () => queryClient.removeQueries({ queryKey: queryOptions.queryKey }),
    prefetch: () => queryClient.prefetchQuery({
      queryKey: queryOptions.queryKey,
      queryFn: wrappedQueryFn
    })
  };
};

// Hook to get query performance analytics
export const useQueryMetrics = () => {
  const [metrics] = useState(queryMetrics);
  
  const getAverageExecutionTime = (queryKey?: string) => {
    const filteredMetrics = queryKey 
      ? metrics.filter(m => m.queryKey.includes(queryKey))
      : metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    return filteredMetrics.reduce((sum, m) => sum + m.executionTime, 0) / filteredMetrics.length;
  };
  
  const getCacheHitRate = (queryKey?: string) => {
    const filteredMetrics = queryKey 
      ? metrics.filter(m => m.queryKey.includes(queryKey))
      : metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const cacheHits = filteredMetrics.filter(m => m.cacheHit).length;
    return (cacheHits / filteredMetrics.length) * 100;
  };
  
  const getErrorRate = (queryKey?: string) => {
    const filteredMetrics = queryKey 
      ? metrics.filter(m => m.queryKey.includes(queryKey))
      : metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const errors = filteredMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    return (errors / filteredMetrics.length) * 100;
  };
  
  return {
    metrics,
    getAverageExecutionTime,
    getCacheHitRate,
    getErrorRate,
    totalQueries: metrics.length
  };
};
