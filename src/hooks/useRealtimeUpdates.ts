
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface RealtimeUpdateConfig {
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export const useRealtimeUpdates = (configs: RealtimeUpdateConfig[]) => {
  const channels: RealtimeChannel[] = [];

  const setupRealtimeSubscription = useCallback((config: RealtimeUpdateConfig) => {
    const channel = supabase
      .channel(`${config.table}_changes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          console.log(`${config.table} INSERT:`, payload);
          config.onInsert?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          console.log(`${config.table} UPDATE:`, payload);
          config.onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          console.log(`${config.table} DELETE:`, payload);
          config.onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Connected to ${config.table} realtime updates`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error connecting to ${config.table} realtime updates`);
          toast.error(`Realtime connection error for ${config.table}`);
        }
      });

    return channel;
  }, []);

  useEffect(() => {
    // Set up subscriptions for all configs
    configs.forEach(config => {
      const channel = setupRealtimeSubscription(config);
      channels.push(channel);
    });

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [configs, setupRealtimeSubscription]);

  const cleanup = useCallback(() => {
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
  }, []);

  return { cleanup };
};
