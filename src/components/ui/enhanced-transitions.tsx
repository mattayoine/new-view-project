
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StepTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  delay?: number;
  className?: string;
}

export const StepTransition: React.FC<StepTransitionProps> = ({
  children,
  isActive,
  isCompleted,
  delay = 0,
  className = ''
}) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-in-out',
        shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        isActive && 'ring-2 ring-blue-500/20 bg-blue-50/50',
        isCompleted && 'bg-green-50/30',
        className
      )}
    >
      {children}
    </div>
  );
};

interface ProgressiveLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  isLoading,
  children,
  fallback
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        {fallback || (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50 duration-300">
      {children}
    </div>
  );
};

interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const statusColors = {
    loading: 'text-blue-500',
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500'
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-full flex items-center justify-center',
          sizeClasses[size],
          statusColors[status],
          status === 'loading' && 'animate-spin'
        )}
      >
        {status === 'loading' && '⟳'}
        {status === 'success' && '✓'}
        {status === 'error' && '✗'}
        {status === 'warning' && '⚠'}
      </div>
      {message && (
        <span className={cn(
          'text-sm',
          statusColors[status]
        )}>
          {message}
        </span>
      )}
    </div>
  );
};
