
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useProjectSharing = (projectId: string) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchShares = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project shares:', error);
        return;
      }

      setShares(data || []);
    } catch (error) {
      console.error('Error fetching project shares:', error);
    }
  };

  const shareProject = async (shareData: {
    email: string;
    message: string;
    permissions: {
      can_view: boolean;
      can_comment: boolean;
      can_approve: boolean;
    };
    expirationDays: number;
  }) => {
    if (!user || !projectId) return;

    try {
      setLoading(true);
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + shareData.expirationDays);

      const { error } = await supabase
        .from('project_shares')
        .insert({
          project_id: projectId,
          shared_by: user.id,
          shared_with_email: shareData.email,
          permissions: shareData.permissions,
          message: shareData.message,
          expires_at: expirationDate.toISOString(),
        });

      if (error) {
        console.error('Error sharing project:', error);
        toast.error('Failed to share project');
        return;
      }

      // Send notification email (would be handled by edge function)
      await supabase.functions.invoke('send-project-share-notification', {
        body: {
          projectId,
          email: shareData.email,
          message: shareData.message,
          permissions: shareData.permissions,
        },
      });

      toast.success('Project shared successfully');
      await fetchShares();
    } catch (error) {
      console.error('Error sharing project:', error);
      toast.error('Failed to share project');
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('project_shares')
        .update({ status: 'revoked' })
        .eq('id', shareId);

      if (error) {
        console.error('Error revoking share:', error);
        toast.error('Failed to revoke access');
        return;
      }

      toast.success('Access revoked successfully');
      await fetchShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Failed to revoke access');
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchShares();
    }
  }, [projectId]);

  return {
    shares,
    loading,
    shareProject,
    revokeShare,
    refreshShares: fetchShares,
  };
};
