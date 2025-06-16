
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface SubscriptionConfig {
  id: string;
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export const useRealtimeManager = (subscriptions: SubscriptionConfig[]) => {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const activeSubscriptionsRef = useRef<Set<string>>(new Set());

  const createSubscription = useCallback((config: SubscriptionConfig) => {
    if (channelsRef.current.has(config.id)) {
      return; // Already subscribed
    }

    const channel = supabase
      .channel(`${config.id}_changes`)
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
          activeSubscriptionsRef.current.add(config.id);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error connecting to ${config.table} realtime updates`);
          toast.error(`Realtime connection error for ${config.table}`);
        }
      });

    channelsRef.current.set(config.id, channel);
  }, []);

  const removeSubscription = useCallback((id: string) => {
    const channel = channelsRef.current.get(id);
    if (channel) {
      supabase.removeChannel(channel);
      channelsRef.current.delete(id);
      activeSubscriptionsRef.current.delete(id);
    }
  }, []);

  const cleanup = useCallback(() => {
    channelsRef.current.forEach((channel, id) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();
    activeSubscriptionsRef.current.clear();
  }, []);

  useEffect(() => {
    // Create subscriptions for all configs
    subscriptions.forEach(createSubscription);

    // Cleanup on unmount or when subscriptions change
    return () => {
      cleanup();
    };
  }, [subscriptions, createSubscription, cleanup]);

  return {
    addSubscription: createSubscription,
    removeSubscription,
    cleanup,
    activeSubscriptions: Array.from(activeSubscriptionsRef.current),
  };
};
