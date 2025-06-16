
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
      // Use raw SQL query to avoid type issues temporarily
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT ps.*, p.name as project_name, p.description as project_description 
              FROM project_shares ps 
              JOIN projects p ON ps.project_id = p.id 
              WHERE ps.shared_with_email = '${user.email}' AND ps.status = 'active'`
      });

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
      // Use raw SQL query to avoid type issues temporarily
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT status, COUNT(*) as count FROM client_feedback WHERE client_email = '${user.email}' GROUP BY status`
      });

      if (error) {
        console.error('Error fetching feedback stats:', error);
        return;
      }

      const stats = data?.reduce((acc: any, item: any) => {
        acc[item.status] = item.count;
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
      // Use raw SQL query to avoid type issues temporarily
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT read, COUNT(*) as count FROM client_notifications WHERE client_email = '${user.email}' GROUP BY read`
      });

      if (error) {
        console.error('Error fetching notification stats:', error);
        return;
      }

      const totalCount = data?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
      const unreadCount = data?.find((item: any) => !item.read)?.count || 0;
      
      setNotifications({
        unread: unreadCount,
        total: totalCount,
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
