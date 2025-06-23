
import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showHeader?: boolean;
  animated?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  lines = 3,
  showAvatar = false,
  showHeader = false,
  animated = true
}) => {
  const pulseClass = animated ? 'animate-pulse' : '';

  return (
    <div className={cn('space-y-3', className)}>
      {showHeader && (
        <div className={cn('h-6 bg-muted rounded w-1/3', pulseClass)} />
      )}
      
      <div className="flex items-start space-x-3">
        {showAvatar && (
          <div className={cn('w-10 h-10 bg-muted rounded-full flex-shrink-0', pulseClass)} />
        )}
        
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 bg-muted rounded',
                i === lines - 1 ? 'w-2/3' : 'w-full',
                pulseClass
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface TableLoadingSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const TableLoadingSkeleton: React.FC<TableLoadingSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {showHeader && (
        <div className="flex space-x-3">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded flex-1 animate-pulse" />
          ))}
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-12 bg-muted rounded flex-1 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
};

interface CardLoadingSkeletonProps {
  count?: number;
  showImage?: boolean;
  className?: string;
}

export const CardLoadingSkeleton: React.FC<CardLoadingSkeletonProps> = ({
  count = 3,
  showImage = false,
  className
}) => {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            {showImage && (
              <div className="h-48 bg-muted rounded-lg mb-4" />
            )}
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'table' | 'cards';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  rows?: number;
  columns?: number;
  count?: number;
  showProgress?: boolean;
  progress?: number;
}

export const EnhancedLoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  message = 'Loading...',
  size = 'md',
  className,
  rows,
  columns,
  count,
  showProgress = false,
  progress = 0
}) => {
  const renderLoadingContent = () => {
    switch (type) {
      case 'skeleton':
        return <LoadingSkeleton lines={rows || 3} showAvatar showHeader />;
      
      case 'table':
        return <TableLoadingSkeleton rows={rows} columns={columns} />;
      
      case 'cards':
        return <CardLoadingSkeleton count={count} showImage />;
      
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <LoadingSpinner size={size} className="mb-4" />
            <p className="text-muted-foreground text-center">{message}</p>
            {showProgress && (
              <div className="w-full max-w-xs mt-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {renderLoadingContent()}
    </div>
  );
};

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [message, setMessage] = React.useState('Loading...');
  const [progress, setProgress] = React.useState(0);

  const startLoading = (loadingMessage?: string) => {
    setIsLoading(true);
    if (loadingMessage) setMessage(loadingMessage);
    setProgress(0);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setProgress(100);
  };

  const updateProgress = (newProgress: number, newMessage?: string) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
    if (newMessage) setMessage(newMessage);
  };

  return {
    isLoading,
    message,
    progress,
    startLoading,
    stopLoading,
    updateProgress
  };
};
