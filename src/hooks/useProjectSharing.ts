
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
      // Use raw SQL query to avoid type issues temporarily
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT * FROM project_shares WHERE project_id = '${projectId}' ORDER BY created_at DESC`
      });

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

      // Use raw SQL query to avoid type issues temporarily
      const { error } = await supabase.rpc('exec_sql', {
        sql: `INSERT INTO project_shares (project_id, shared_by, shared_with_email, permissions, message, expires_at) 
              VALUES ('${projectId}', '${user.id}', '${shareData.email}', '${JSON.stringify(shareData.permissions)}', '${shareData.message}', '${expirationDate.toISOString()}')`
      });

      if (error) {
        console.error('Error sharing project:', error);
        toast.error('Failed to share project');
        return;
      }

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
      // Use raw SQL query to avoid type issues temporarily
      const { error } = await supabase.rpc('exec_sql', {
        sql: `UPDATE project_shares SET status = 'revoked' WHERE id = '${shareId}'`
      });

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
