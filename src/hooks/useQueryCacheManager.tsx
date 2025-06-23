
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface CacheManagerOptions {
  enableBackgroundUpdates?: boolean;
  cacheTime?: number;
  staleTime?: number;
  gcTime?: number;
}

export const useQueryCacheManager = (options: CacheManagerOptions = {}) => {
  const queryClient = useQueryClient();
  
  const {
    enableBackgroundUpdates = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000, // 1 minute
    gcTime = 10 * 60 * 1000 // 10 minutes
  } = options;

  // Set default options for all queries
  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        staleTime,
        gcTime,
        refetchOnWindowFocus: enableBackgroundUpdates,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          // Don't retry auth errors
          if (error?.message?.includes('auth') || error?.message?.includes('401')) {
            return false;
          }
          return failureCount < 3;
        }
      }
    });
  }, [queryClient, staleTime, gcTime, enableBackgroundUpdates]);

  const prefetchQuery = useCallback(async (queryKey: string[], queryFn: () => Promise<any>) => {
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime
      });
    } catch (error) {
      console.error('Failed to prefetch query:', queryKey, error);
    }
  }, [queryClient, staleTime]);

  const invalidateQueries = useCallback((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  const clearCache = useCallback(() => {
    queryClient.clear();
    toast.success('Cache cleared');
  }, [queryClient]);

  const getCacheSize = useCallback(() => {
    const cache = queryClient.getQueryCache();
    return cache.getAll().length;
  }, [queryClient]);

  const optimizeCache = useCallback(() => {
    // Remove expired queries
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    let removedCount = 0;
    queries.forEach(query => {
      const state = query.state;
      const isStale = Date.now() - state.dataUpdatedAt > staleTime;
      const hasErrors = state.error !== null;
      
      if (isStale || hasErrors) {
        queryClient.removeQueries({ queryKey: query.queryKey });
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      toast.success(`Optimized cache: removed ${removedCount} expired queries`);
    }
  }, [queryClient, staleTime]);

  // Auto-optimize cache every 5 minutes
  useEffect(() => {
    const interval = setInterval(optimizeCache, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [optimizeCache]);

  const getQueryStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      total: queries.length,
      fresh: 0,
      stale: 0,
      loading: 0,
      error: 0
    };
    
    queries.forEach(query => {
      const state = query.state;
      
      // Fix: Use fetchStatus instead of isFetching for loading state
      if (state.fetchStatus === 'fetching') {
        stats.loading++;
      } else if (state.error) {
        stats.error++;
      } else if (Date.now() - state.dataUpdatedAt > staleTime) {
        stats.stale++;
      } else {
        stats.fresh++;
      }
    });
    
    return stats;
  }, [queryClient, staleTime]);

  return {
    prefetchQuery,
    invalidateQueries,
    clearCache,
    getCacheSize,
    optimizeCache,
    getQueryStats
  };
};
