
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/integrations/supabase/types';

type UserPresence = Database['public']['Tables']['user_presence']['Row'];

export const useUserPresence = (sessionId?: string) => {
  const [userPresence, setUserPresence] = useState<UserPresence[]>([]);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const updateCursorPosition = useCallback(async (position: { x: number; y: number }) => {
    if (!user || !sessionId || !mountedRef.current) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .update({
          cursor_position: position as any,
          last_seen: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating cursor position:', error);
      }
    } catch (error) {
      console.error('Error updating cursor position:', error);
    }
  }, [user, sessionId]);

  const updatePresence = useCallback(async (isActive: boolean) => {
    if (!user || !sessionId || !mountedRef.current) return;

    try {
      const userColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
      
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          session_id: sessionId,
          user_id: user.id,
          is_active: isActive,
          user_color: userColor,
          last_seen: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating presence:', error);
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user, sessionId]);

  const fetchPresenceData = useCallback(async () => {
    if (!sessionId || !mountedRef.current) return;

    try {
      const { data } = await supabase
        .from('user_presence')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq('session_id', sessionId)
        .eq('is_active', true);
      
      if (mountedRef.current) {
        setUserPresence(data || []);
      }
    } catch (error) {
      console.error('Error fetching presence data:', error);
    }
  }, [sessionId]);

  const cleanup = useCallback(() => {
    console.log('Cleaning up user presence subscription');
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log('User presence channel removed successfully');
      } catch (error) {
        console.error('Error removing user presence channel:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!sessionId || !user) {
      cleanup();
      return;
    }

    console.log(`Setting up user presence for session: ${sessionId}`);

    // Clean up any existing channel
    cleanup();

    // Create new channel
    const presenceChannel = supabase
      .channel(`presence-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          if (mountedRef.current) {
            fetchPresenceData();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to presence updates for session: ${sessionId}`);
          fetchPresenceData();
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to presence for session: ${sessionId}`);
        }
      });

    channelRef.current = presenceChannel;

    // Cleanup function
    return cleanup;
  }, [sessionId, user, cleanup, fetchPresenceData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('UserPresence hook unmounting');
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    userPresence,
    updateCursorPosition,
    updatePresence,
    cleanup,
  };
};
