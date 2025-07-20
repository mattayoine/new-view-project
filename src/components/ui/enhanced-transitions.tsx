
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface StepTransitionProps {
  children: react.ReactNode;
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
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        isCompleted && 'scale-105 shadow-lg',
        isActive && 'ring-2 ring-primary ring-opacity-50',
        className
      )}
    >
      {children}
    </div>
  );
};

interface ProgressiveLoaderProps {
  stages: string[];
  currentStage: number;
  className?: string;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  stages,
  currentStage,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <div className="space-y-1">
        {stages.map((stage, index) => (
          <div
            key={index}
            className={cn(
              'text-sm transition-all duration-300',
              index < currentStage 
                ? 'text-green-600 opacity-100' 
                : index === currentStage 
                ? 'text-primary opacity-100 font-medium animate-pulse' 
                : 'text-muted-foreground opacity-60'
            )}
          >
            {index < currentStage && '✓ '}
            {index === currentStage && '⟳ '}
            {stage}
          </div>
        ))}
      </div>
    </div>
  );
};

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  animated?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  animated = true,
  className
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'loading':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'loading':
        return '⟳';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-md border text-sm font-medium flex items-center gap-2',
        getStatusStyles(),
        animated && status === 'loading' && 'animate-pulse',
        animated && status === 'success' && 'success-pulse',
        className
      )}
    >
      <span className={animated && status === 'loading' ? 'animate-spin' : ''}>
        {getIcon()}
      </span>
      {message}
    </div>
  );
};
