
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/integrations/supabase/types';

type UserPresence = Database['public']['Tables']['user_presence']['Row'];

export const useUserPresence = (sessionId?: string) => {
  const [userPresence, setUserPresence] = useState<UserPresence[]>([]);
  const { user } = useAuth();

  const updateCursorPosition = useCallback(async (position: { x: number; y: number }) => {
    if (!user || !sessionId) return;

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
    if (!user || !sessionId) return;

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

  useEffect(() => {
    if (!sessionId || !user) return;

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
        async () => {
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
          
          setUserPresence(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [sessionId, user]);

  return {
    userPresence,
    updateCursorPosition,
    updatePresence,
  };
};
