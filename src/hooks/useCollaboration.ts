
import { useEffect } from 'react';
import { useCollaborationSessions } from './collaboration/useCollaborationSessions';
import { useUserPresence } from './collaboration/useUserPresence';
import { useOperationalTransform } from './collaboration/useOperationalTransform';
import { useCollaborationPermissions } from './collaboration/useCollaborationPermissions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

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
  [key: string]: any;
}

export const useCollaboration = (projectId?: string) => {
  const { user } = useAuth();
  
  const sessionHooks = useCollaborationSessions(projectId);
  const presenceHooks = useUserPresence(sessionHooks.activeSession?.id);
  const operationHooks = useOperationalTransform(sessionHooks.activeSession?.id);
  const permissionHooks = useCollaborationPermissions(sessionHooks.activeSession?.id);

  // Set up real-time subscriptions for changes
  useEffect(() => {
    if (!sessionHooks.activeSession || !user) return;

    const changesChannel = supabase
      .channel(`changes-${sessionHooks.activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaboration_changes',
          filter: `session_id=eq.${sessionHooks.activeSession.id}`,
        },
        (payload) => {
          const change = payload.new;
          if (change.user_id !== user.id) {
            operationHooks.handleIncomingChange(change);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(changesChannel);
    };
  }, [sessionHooks.activeSession, user, operationHooks.handleIncomingChange]);

  // Auto-update presence when joining a session
  useEffect(() => {
    if (sessionHooks.activeSession) {
      presenceHooks.updatePresence(true);
    }
  }, [sessionHooks.activeSession, presenceHooks.updatePresence]);

  return {
    // Session management
    sessions: sessionHooks.sessions,
    activeSession: sessionHooks.activeSession,
    loading: sessionHooks.loading,
    createSession: sessionHooks.createSession,
    joinSession: sessionHooks.joinSession,
    leaveSession: sessionHooks.leaveSession,
    fetchSessions: sessionHooks.fetchSessions,
    
    // User presence
    userPresence: presenceHooks.userPresence,
    updateCursorPosition: presenceHooks.updateCursorPosition,
    
    // Operations
    applyOperation: operationHooks.applyOperation,
    
    // Permissions
    permissions: permissionHooks.permissions,
    grantPermission: permissionHooks.grantPermission,
  };
};
