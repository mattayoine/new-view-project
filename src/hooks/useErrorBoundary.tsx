
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
}

export const useErrorBoundary = () => {
  const [error, setError] = useState<ErrorInfo | null>(null);

  const captureError = useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    const errorData: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    };
    
    setError(errorData);
    
    // Log to console for debugging
    console.error('Error captured:', error, errorInfo);
    
    // Show user-friendly toast
    toast.error('Something went wrong. Please try again.');
    
    // Here you could also send to an error tracking service
    // trackError(errorData);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    captureError,
    clearError,
    hasError: error !== null
  };
};

export const useAsyncError = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAsync = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    errorMessage = 'Operation failed'
  ): Promise<T | null> => {
    setIsPending(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      return result;
    } catch (err: any) {
      const errorText = err.message || errorMessage;
      setError(errorText);
      toast.error(errorText);
      console.error('Async operation failed:', err);
      return null;
    } finally {
      setIsPending(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeAsync,
    isPending,
    error,
    clearError,
    hasError: error !== null
  };
};
