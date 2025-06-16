
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useProjectProgress = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjectProgress = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select(`
          *,
          projects!inner(name, description),
          project_progress(progress_percentage, status, milestones, recent_updates)
        `)
        .eq('shared_with_email', user.email)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching project progress:', error);
        toast.error('Failed to load project progress');
        return;
      }

      const processedProjects = data?.map((share: any) => ({
        id: share.project_id,
        name: share.projects?.name || 'Unknown Project',
        description: share.projects?.description || '',
        status: share.project_progress?.status || 'in_progress',
        progress: share.project_progress?.progress_percentage || 0,
        milestones: share.project_progress?.milestones || [],
        recent_updates: share.project_progress?.recent_updates || [],
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
    if (user?.email) {
      fetchProjectProgress();
    }
  }, [user]);

  return {
    projects,
    loading,
    refreshProgress: fetchProjectProgress,
  };
};
