
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Use raw SQL query to avoid type issues temporarily
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT * FROM client_notifications WHERE client_email = '${user.email}' ORDER BY created_at DESC`
      });

      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Use raw SQL query to avoid type issues temporarily
      const { error } = await supabase.rpc('exec_sql', {
        sql: `UPDATE client_notifications SET read = true WHERE id = '${notificationId}'`
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Use raw SQL query to avoid type issues temporarily
      const { error } = await supabase.rpc('exec_sql', {
        sql: `UPDATE client_notifications SET read = true WHERE client_email = '${user.email}' AND read = false`
      });

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      await fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};
