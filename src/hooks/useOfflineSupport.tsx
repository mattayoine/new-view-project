
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  description: string;
  timestamp: number;
}

export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedOperations, setQueuedOperations] = useState<QueuedOperation[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored. Syncing data...');
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      
      // Process queued operations
      processQueuedOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will be synced when connection is restored.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  const queueOperation = useCallback((operation: () => Promise<any>, description: string) => {
    const queuedOp: QueuedOperation = {
      id: `${Date.now()}-${Math.random()}`,
      operation,
      description,
      timestamp: Date.now()
    };

    setQueuedOperations(prev => [...prev, queuedOp]);
    
    if (!isOnline) {
      toast.info(`"${description}" queued for when connection is restored`);
    }

    return queuedOp.id;
  }, [isOnline]);

  const processQueuedOperations = useCallback(async () => {
    if (queuedOperations.length === 0) return;

    const operations = [...queuedOperations];
    setQueuedOperations([]);

    for (const queuedOp of operations) {
      try {
        await queuedOp.operation();
        console.log(`Processed queued operation: ${queuedOp.description}`);
      } catch (error) {
        console.error(`Failed to process queued operation: ${queuedOp.description}`, error);
        
        // Re-queue failed operations
        setQueuedOperations(prev => [...prev, queuedOp]);
      }
    }

    if (operations.length > 0) {
      toast.success(`Synced ${operations.length} pending changes`);
    }
  }, [queuedOperations]);

  const executeOperation = useCallback(async (
    operation: () => Promise<any>,
    description: string
  ) => {
    if (isOnline) {
      return await operation();
    } else {
      queueOperation(operation, description);
      return null;
    }
  }, [isOnline, queueOperation]);

  return {
    isOnline,
    queuedOperationsCount: queuedOperations.length,
    executeOperation,
    queueOperation,
    processQueuedOperations
  };
};
