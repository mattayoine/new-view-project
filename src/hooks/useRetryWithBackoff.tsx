
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
  onMaxRetriesReached?: (error: any) => void;
}

export const useRetryWithBackoff = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      onRetry,
      onMaxRetriesReached
    } = options;

    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        
        if (attempt > 0) {
          setIsRetrying(true);
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
          onRetry?.(attempt, lastError);
        }

        const result = await operation();
        setIsRetrying(false);
        setRetryCount(0);
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries) {
          setIsRetrying(false);
          setRetryCount(0);
          onMaxRetriesReached?.(error);
          
          toast.error(`Operation failed after ${maxRetries + 1} attempts`, {
            description: 'Please try again later or contact support if the issue persists.'
          });
          
          throw error;
        }
      }
    }

    throw lastError;
  }, []);

  return {
    executeWithRetry,
    isRetrying,
    retryCount
  };
};
