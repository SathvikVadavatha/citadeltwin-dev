
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useClientPortal = () => {
  const [sharedProjects, setSharedProjects] = useState<any[]>([]);
  const [feedback, setFeedback] = useState({
    pending: 0,
    approved: 0,
    inProgress: 0,
  });
  const [notifications, setNotifications] = useState({
    unread: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSharedProjects = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select(`
          *,
          projects!inner(name, description)
        `)
        .eq('shared_with_email', user.email)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching shared projects:', error);
        return;
      }

      const processedProjects = data?.map((share: any) => ({
        id: share.project_id,
        name: share.projects?.name || 'Unknown Project',
        description: share.projects?.description || '',
        status: share.status,
        shared_at: share.created_at,
        permissions: share.permissions,
        project_data: share.projects
      })) || [];

      setSharedProjects(processedProjects);
    } catch (error) {
      console.error('Error fetching shared projects:', error);
    }
  };

  const fetchFeedbackStats = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('client_feedback')
        .select('status')
        .eq('client_email', user.email);

      if (error) {
        console.error('Error fetching feedback stats:', error);
        return;
      }

      const stats = (data || []).reduce((acc: any, item: any) => {
        const status = item.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setFeedback({
        pending: stats.pending || 0,
        approved: stats.approved || 0,
        inProgress: stats.in_progress || 0,
      });
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  };

  const fetchNotificationStats = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('client_notifications')
        .select('read')
        .eq('client_email', user.email);

      if (error) {
        console.error('Error fetching notification stats:', error);
        return;
      }

      const totalCount = data?.length || 0;
      const unreadCount = data?.filter(item => !item.read).length || 0;
      
      setNotifications({
        unread: unreadCount,
        total: totalCount,
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  useEffect(() => {
    if (user?.email) {
      Promise.all([
        fetchSharedProjects(),
        fetchFeedbackStats(),
        fetchNotificationStats(),
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  return {
    sharedProjects,
    feedback,
    notifications,
    loading,
    refreshData: () => {
      fetchSharedProjects();
      fetchFeedbackStats();
      fetchNotificationStats();
    },
  };
};
