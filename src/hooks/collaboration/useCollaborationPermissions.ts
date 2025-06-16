
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CollaborationPermission = Database['public']['Tables']['collaboration_permissions']['Row'];

export const useCollaborationPermissions = (sessionId?: string) => {
  const [permissions, setPermissions] = useState<CollaborationPermission[]>([]);
  const { user } = useAuth();

  const grantPermission = useCallback(async (userId: string, permissionLevel: 'view' | 'edit' | 'owner') => {
    if (!user || !sessionId) return;

    try {
      const { error } = await supabase
        .from('collaboration_permissions')
        .upsert({
          session_id: sessionId,
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
  }, [user, sessionId]);

  const fetchPermissions = useCallback(async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('collaboration_permissions')
        .select('*')
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error fetching permissions:', error);
        return;
      }

      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  }, [sessionId]);

  return {
    permissions,
    grantPermission,
    fetchPermissions,
  };
};
