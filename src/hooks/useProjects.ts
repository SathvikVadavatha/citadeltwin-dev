
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  project_type: 'residential' | 'commercial' | 'industrial' | 'infrastructure';
  status: 'active' | 'completed' | 'archived';
  location_data?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  project_type: 'residential' | 'commercial' | 'industrial' | 'infrastructure';
  location_data?: any;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: CreateProjectData): Promise<Project | null> => {
    if (!user) return null;

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast.error('Failed to create project');
        return null;
      }

      toast.success('Project created successfully');
      await fetchProjects(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateProject = async (id: string, updates: Partial<CreateProjectData>): Promise<Project | null> => {
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project');
        return null;
      }

      toast.success('Project updated successfully');
      await fetchProjects(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
        return false;
      }

      toast.success('Project deleted successfully');
      await fetchProjects(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [user]);

  return {
    projects,
    loading,
    creating,
    updating,
    deleting,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects: fetchProjects,
  };
};
