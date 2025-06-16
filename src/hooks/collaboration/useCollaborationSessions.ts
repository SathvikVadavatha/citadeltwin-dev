
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CollaborationSession = Database['public']['Tables']['collaboration_sessions']['Row'];

export interface CreateSessionData {
  project_id: string;
  name: string;
  settings?: any;
}

export const useCollaborationSessions = (projectId?: string) => {
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSessions = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching collaboration sessions:', error);
        toast.error('Failed to load collaboration sessions');
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching collaboration sessions:', error);
      toast.error('Failed to load collaboration sessions');
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  const createSession = useCallback(async (sessionData: CreateSessionData): Promise<CollaborationSession | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          ...sessionData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating collaboration session:', error);
        toast.error('Failed to create collaboration session');
        return null;
      }

      await supabase
        .from('collaboration_permissions')
        .insert({
          session_id: data.id,
          user_id: user.id,
          permission_level: 'owner',
          granted_by: user.id,
        });

      toast.success('Collaboration session created successfully');
      await fetchSessions();
      return data;
    } catch (error) {
      console.error('Error creating collaboration session:', error);
      toast.error('Failed to create collaboration session');
      return null;
    }
  }, [user, fetchSessions]);

  const joinSession = useCallback(async (sessionId: string) => {
    if (!user) return;

    try {
      setActiveSession(sessions.find(s => s.id === sessionId) || null);
      toast.success('Joined collaboration session');
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join collaboration session');
    }
  }, [sessions, user]);

  const leaveSession = useCallback(async () => {
    if (!user || !activeSession) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .update({ is_active: false })
        .eq('session_id', activeSession.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving session:', error);
        toast.error('Failed to leave collaboration session');
        return;
      }

      setActiveSession(null);
      toast.success('Left collaboration session');
    } catch (error) {
      console.error('Error leaving session:', error);
      toast.error('Failed to leave collaboration session');
    }
  }, [user, activeSession]);

  return {
    sessions,
    activeSession,
    loading,
    createSession,
    joinSession,
    leaveSession,
    fetchSessions,
    setActiveSession,
  };
};
