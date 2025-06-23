
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RetryQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  maxRetries?: number;
  retryDelay?: number;
  showErrorToast?: boolean;
}

export const useRetryQuery = <T,>({
  queryFn,
  maxRetries = 3,
  retryDelay = 1000,
  showErrorToast = true,
  ...queryOptions
}: RetryQueryOptions<T>) => {
  return useQuery({
    ...queryOptions,
    queryFn,
    retry: (failureCount, error) => {
      if (failureCount >= maxRetries) {
        if (showErrorToast) {
          toast.error(`Failed to load data after ${maxRetries} attempts`);
        }
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Query failed:', error);
      if (showErrorToast) {
        toast.error('Failed to load data. Retrying...');
      }
    }
  });
};
