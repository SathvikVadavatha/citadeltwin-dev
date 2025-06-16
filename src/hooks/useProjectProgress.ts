
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useProjectProgress = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjectProgress = async () => {
    if (!user) return;

    try {
      // Use raw SQL query to avoid type issues temporarily
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT ps.*, p.name as project_name, p.description as project_description, 
                     pp.progress_percentage, pp.status, pp.milestones, pp.recent_updates
              FROM project_shares ps 
              JOIN projects p ON ps.project_id = p.id 
              LEFT JOIN project_progress pp ON ps.project_id = pp.project_id
              WHERE ps.shared_with_email = '${user.email}' AND ps.status = 'active'`
      });

      if (error) {
        console.error('Error fetching project progress:', error);
        toast.error('Failed to load project progress');
        return;
      }

      const processedProjects = data?.map((share: any) => ({
        id: share.project_id,
        name: share.project_name,
        description: share.project_description,
        status: share.status || 'in_progress',
        progress: share.progress_percentage || 0,
        milestones: share.milestones || [],
        recent_updates: share.recent_updates || [],
        shared_at: share.created_at,
      })) || [];

      setProjects(processedProjects);
    } catch (error) {
      console.error('Error fetching project progress:', error);
      toast.error('Failed to load project progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjectProgress();
    }
  }, [user]);

  return {
    projects,
    loading,
    refreshProgress: fetchProjectProgress,
  };
};
