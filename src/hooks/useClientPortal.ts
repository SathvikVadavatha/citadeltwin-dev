
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useClientPortal = () => {
  const [sharedProjects, setSharedProjects] = useState([]);
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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select(`
          *,
          projects (
            id,
            name,
            description
          )
        `)
        .eq('shared_with_email', user.email)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching shared projects:', error);
        return;
      }

      setSharedProjects(data || []);
    } catch (error) {
      console.error('Error fetching shared projects:', error);
    }
  };

  const fetchFeedbackStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('client_feedback')
        .select('status')
        .eq('client_email', user.email);

      if (error) {
        console.error('Error fetching feedback stats:', error);
        return;
      }

      const stats = data?.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      setFeedback({
        pending: stats?.pending || 0,
        approved: stats?.approved || 0,
        inProgress: stats?.in_progress || 0,
      });
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  };

  const fetchNotificationStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('client_notifications')
        .select('read')
        .eq('client_email', user.email);

      if (error) {
        console.error('Error fetching notification stats:', error);
        return;
      }

      const unreadCount = data?.filter(n => !n.read).length || 0;
      
      setNotifications({
        unread: unreadCount,
        total: data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
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
