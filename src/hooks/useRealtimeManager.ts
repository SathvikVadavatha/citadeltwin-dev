
import { useEffect, useCallback, useRef, useMemo } from 'react';
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
  const mountedRef = useRef(true);

  // Create stable subscription identifier to prevent unnecessary recreations
  const subscriptionsKey = useMemo(() => {
    return subscriptions
      .map(sub => `${sub.id}:${sub.table}:${sub.filter || 'no-filter'}`)
      .sort()
      .join('|');
  }, [subscriptions]);

  const createSubscription = useCallback((config: SubscriptionConfig) => {
    if (!mountedRef.current) return;
    
    // Don't recreate if already exists
    if (channelsRef.current.has(config.id)) {
      console.log(`Channel ${config.id} already exists, skipping creation`);
      return;
    }

    console.log(`Creating subscription for ${config.id}`);
    
    const channel = supabase
      .channel(`${config.id}_realtime`)
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
          activeSubscriptionsRef.current.add(config.id);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error connecting to ${config.table} realtime updates`);
          toast.error(`Realtime connection error for ${config.table}`);
          activeSubscriptionsRef.current.delete(config.id);
        }
      });

    channelsRef.current.set(config.id, channel);
  }, []);

  const removeSubscription = useCallback((id: string) => {
    const channel = channelsRef.current.get(id);
    if (channel) {
      console.log(`Removing subscription ${id}`);
      try {
        supabase.removeChannel(channel);
        channelsRef.current.delete(id);
        activeSubscriptionsRef.current.delete(id);
        console.log(`Successfully removed subscription ${id}`);
      } catch (error) {
        console.error(`Error removing subscription ${id}:`, error);
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    console.log(`Cleaning up ${channelsRef.current.size} subscriptions`);
    const channelIds = Array.from(channelsRef.current.keys());
    
    channelIds.forEach(id => {
      removeSubscription(id);
    });
    
    channelsRef.current.clear();
    activeSubscriptionsRef.current.clear();
    console.log('All subscriptions cleaned up');
  }, [removeSubscription]);

  // Main effect for managing subscriptions
  useEffect(() => {
    console.log('Setting up realtime subscriptions:', subscriptionsKey);
    
    // Clean up all existing subscriptions
    cleanup();
    
    // Create new subscriptions
    subscriptions.forEach(createSubscription);

    // Cleanup function
    return cleanup;
  }, [subscriptionsKey, createSubscription, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up subscriptions');
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    addSubscription: createSubscription,
    removeSubscription,
    cleanup,
    activeSubscriptions: Array.from(activeSubscriptionsRef.current),
  };
};
