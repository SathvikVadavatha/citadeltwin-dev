
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useClientFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchFeedback = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Use raw SQL query to avoid type issues temporarily
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT * FROM client_feedback WHERE client_email = '${user.email}' ORDER BY created_at DESC`
      });

      if (error) {
        console.error('Error fetching feedback:', error);
        toast.error('Failed to load feedback');
        return;
      }

      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (feedbackData: {
    content: string;
    type: string;
    project_id?: string;
  }) => {
    if (!user) return;

    try {
      setLoading(true);
      // Use raw SQL query to avoid type issues temporarily
      const { error } = await supabase.rpc('exec_sql', {
        sql: `INSERT INTO client_feedback (content, type, project_id, client_email, client_name) 
              VALUES ('${feedbackData.content}', '${feedbackData.type}', ${feedbackData.project_id ? `'${feedbackData.project_id}'` : 'NULL'}, '${user.email}', '${user.user_metadata?.full_name || user.email}')`
      });

      if (error) {
        console.error('Error submitting feedback:', error);
        toast.error('Failed to submit feedback');
        return;
      }

      toast.success('Feedback submitted successfully');
      await fetchFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user]);

  return {
    feedback,
    loading,
    submitFeedback,
    refreshFeedback: fetchFeedback,
  };
};
