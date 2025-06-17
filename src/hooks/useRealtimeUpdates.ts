
import { useEffect, useCallback, useRef } from 'react';
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
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const mountedRef = useRef(true);

  const setupRealtimeSubscription = useCallback((config: RealtimeUpdateConfig, index: number) => {
    const channelName = `${config.table}_changes_${index}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          if (mountedRef.current) {
            console.log(`${config.table} INSERT:`, payload);
            config.onInsert?.(payload);
          }
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
          if (mountedRef.current) {
            console.log(`${config.table} UPDATE:`, payload);
            config.onUpdate?.(payload);
          }
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
          if (mountedRef.current) {
            console.log(`${config.table} DELETE:`, payload);
            config.onDelete?.(payload);
          }
        }
      )
      .subscribe((status) => {
        if (!mountedRef.current) return;
        
        if (status === 'SUBSCRIBED') {
          console.log(`Connected to ${config.table} realtime updates`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error connecting to ${config.table} realtime updates`);
          toast.error(`Realtime connection error for ${config.table}`);
        }
      });

    return channel;
  }, []);

  const cleanup = useCallback(() => {
    console.log(`Cleaning up ${channelsRef.current.length} realtime channels`);
    channelsRef.current.forEach((channel, index) => {
      try {
        supabase.removeChannel(channel);
        console.log(`Removed channel ${index}`);
      } catch (error) {
        console.error(`Error removing channel ${index}:`, error);
      }
    });
    channelsRef.current = [];
  }, []);

  useEffect(() => {
    // Clean up any existing channels first
    cleanup();
    
    // Set up new subscriptions
    const newChannels = configs.map((config, index) => 
      setupRealtimeSubscription(config, index)
    );
    
    channelsRef.current = newChannels;

    // Cleanup function
    return () => {
      cleanup();
    };
  }, [configs.map(c => `${c.table}-${c.filter}`).join('|'), setupRealtimeSubscription, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return { cleanup };
};
