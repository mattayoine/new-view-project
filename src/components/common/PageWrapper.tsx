
import React from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useErrorBoundary } from '@/hooks/useErrorBoundary';

interface PageWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  isLoading = false,
  error = null,
  onRetry,
  loadingMessage = 'Loading...',
  errorTitle = 'Something went wrong',
  errorMessage
}) => {
  const { hasError, error: boundaryError, clearError } = useErrorBoundary();

  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (error || hasError) {
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage || error || boundaryError?.message}
        onRetry={() => {
          clearError();
          onRetry?.();
        }}
      />
    );
  }

  return <>{children}</>;
};
