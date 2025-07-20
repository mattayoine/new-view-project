
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingAnimationProps {
  variant?: 'spinner' | 'pulse' | 'bounce' | 'fade' | 'scale';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  variant = 'spinner',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const baseClasses = cn(sizeClasses[size], className);

  switch (variant) {
    case 'spinner':
      return (
        <div
          className={cn(
            baseClasses,
            'animate-spin rounded-full border-2 border-muted border-t-primary'
          )}
        />
      );

    case 'pulse':
      return (
        <div className={cn(baseClasses, 'animate-pulse bg-primary/20 rounded-full')} />
      );

    case 'bounce':
      return (
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'bg-primary rounded-full animate-bounce',
                size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      );

    case 'fade':
      return (
        <div
          className={cn(
            baseClasses,
            'bg-primary/60 rounded-full animate-pulse'
          )}
          style={{
            animation: 'fadeInOut 1.5s ease-in-out infinite'
          }}
        />
      );

    case 'scale':
      return (
        <div
          className={cn(
            baseClasses,
            'bg-primary/40 rounded-full'
          )}
          style={{
            animation: 'scaleInOut 1s ease-in-out infinite'
          }}
        />
      );

    default:
      return null;
  }
};

// Skeleton loading component for content areas
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  animation = 'pulse'
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse'
  };

  return (
    <div
      className={cn(
        'bg-muted',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
    />
  );
};

// Complex loading state for cards/sections
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('border rounded-lg p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-5/6" />
      <Skeleton variant="text" className="h-3 w-4/6" />
    </div>
  </div>
);

// Loading overlay for entire sections
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = 'Loading...',
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <LoadingAnimation variant="spinner" size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
