
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CollaborationSession = Database['public']['Tables']['collaboration_sessions']['Row'];
type UserPresence = Database['public']['Tables']['user_presence']['Row'];
type CollaborationChange = Database['public']['Tables']['collaboration_changes']['Row'];
type CollaborationPermission = Database['public']['Tables']['collaboration_permissions']['Row'];

export interface CreateSessionData {
  project_id: string;
  name: string;
  settings?: any;
}

export interface OperationData {
  type: 'create' | 'update' | 'delete' | 'transform';
  elementId?: string;
  elementType?: string;
  properties?: any;
  oldProperties?: any;
  position?: any;
}

export const useCollaboration = (projectId?: string) => {
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);
  const [userPresence, setUserPresence] = useState<UserPresence[]>([]);
  const [permissions, setPermissions] = useState<CollaborationPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationIndex, setOperationIndex] = useState(0);
  const { user } = useAuth();

  // Fetch sessions for a project
  const fetchSessions = async () => {
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
  };

  // Create a new collaboration session
  const createSession = async (sessionData: CreateSessionData): Promise<CollaborationSession | null> => {
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

      // Grant owner permission to creator
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
  };

  // Join a collaboration session
  const joinSession = async (sessionId: string) => {
    if (!user) return;

    try {
      setActiveSession(sessions.find(s => s.id === sessionId) || null);
      
      // Update or create user presence
      const userColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
      
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          session_id: sessionId,
          user_id: user.id,
          is_active: true,
          user_color: userColor,
          last_seen: new Date().toISOString(),
        });

      if (error) {
        console.error('Error joining session:', error);
        toast.error('Failed to join collaboration session');
        return;
      }

      toast.success('Joined collaboration session');
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join collaboration session');
    }
  };

  // Leave a collaboration session
  const leaveSession = async () => {
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
  };

  // Apply an operation (with operational transformation)
  const applyOperation = async (operation: OperationData) => {
    if (!user || !activeSession) return;

    try {
      const currentIndex = operationIndex;
      setOperationIndex(prev => prev + 1);

      const { error } = await supabase
        .from('collaboration_changes')
        .insert({
          session_id: activeSession.id,
          user_id: user.id,
          change_type: operation.type,
          element_id: operation.elementId,
          element_type: operation.elementType,
          operation_data: operation,
          operation_index: currentIndex,
        });

      if (error) {
        console.error('Error applying operation:', error);
        toast.error('Failed to apply changes');
        return;
      }
    } catch (error) {
      console.error('Error applying operation:', error);
      toast.error('Failed to apply changes');
    }
  };

  // Update cursor position
  const updateCursorPosition = async (position: { x: number; y: number }) => {
    if (!user || !activeSession) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .update({
          cursor_position: position,
          last_seen: new Date().toISOString(),
        })
        .eq('session_id', activeSession.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating cursor position:', error);
      }
    } catch (error) {
      console.error('Error updating cursor position:', error);
    }
  };

  // Grant permission to a user
  const grantPermission = async (userId: string, permissionLevel: 'view' | 'edit' | 'owner') => {
    if (!user || !activeSession) return;

    try {
      const { error } = await supabase
        .from('collaboration_permissions')
        .upsert({
          session_id: activeSession.id,
          user_id: userId,
          permission_level: permissionLevel,
          granted_by: user.id,
        });

      if (error) {
        console.error('Error granting permission:', error);
        toast.error('Failed to grant permission');
        return;
      }

      toast.success('Permission granted successfully');
    } catch (error) {
      console.error('Error granting permission:', error);
      toast.error('Failed to grant permission');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!activeSession || !user) return;

    // Subscribe to presence changes
    const presenceChannel = supabase
      .channel(`presence-${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `session_id=eq.${activeSession.id}`,
        },
        async () => {
          // Fetch updated presence data
          const { data } = await supabase
            .from('user_presence')
            .select(`
              *,
              profiles:user_id (
                full_name
              )
            `)
            .eq('session_id', activeSession.id)
            .eq('is_active', true);
          
          setUserPresence(data || []);
        }
      )
      .subscribe();

    // Subscribe to collaboration changes
    const changesChannel = supabase
      .channel(`changes-${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaboration_changes',
          filter: `session_id=eq.${activeSession.id}`,
        },
        (payload) => {
          const change = payload.new as CollaborationChange;
          if (change.user_id !== user.id) {
            // Handle incoming change from another user
            handleIncomingChange(change);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(changesChannel);
    };
  }, [activeSession, user]);

  // Handle incoming changes with operational transformation
  const handleIncomingChange = useCallback((change: CollaborationChange) => {
    console.log('Incoming change:', change);
    // Implement operational transformation logic here
    // This would transform the incoming operation based on local operations
    // For now, we'll just log it
    toast.info(`${change.change_type} operation received from another user`);
  }, []);

  // Load initial data
  useEffect(() => {
    if (user && projectId) {
      fetchSessions();
    }
  }, [user, projectId]);

  return {
    sessions,
    activeSession,
    userPresence,
    permissions,
    loading,
    createSession,
    joinSession,
    leaveSession,
    applyOperation,
    updateCursorPosition,
    grantPermission,
    fetchSessions,
  };
};
