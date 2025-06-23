
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscriptionOptions {
  table: string;
  queryKey: string[];
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

export const useRealTimeSubscription = ({
  table,
  queryKey,
  filter,
  event = '*'
}: RealtimeSubscriptionOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const subscriptionConfig: any = {
      event,
      schema: 'public',
      table
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes' as any,
        subscriptionConfig,
        () => {
          // Invalidate and refetch the query when data changes
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, queryKey, filter, event, queryClient]);

  return channelRef.current;
};
