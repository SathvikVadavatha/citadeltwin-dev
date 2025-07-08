import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface IFCModel {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  model_metadata: any;
  upload_status: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIFCModelData {
  project_id?: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  model_metadata?: any;
}

export const useIFCModels = (projectId?: string) => {
  const [models, setModels] = useState<IFCModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const fetchModels = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('ifc_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching IFC models:', error);
        toast.error('Failed to load IFC models');
        return;
      }

      setModels((data || []) as IFCModel[]);
    } catch (error) {
      console.error('Error fetching IFC models:', error);
      toast.error('Failed to load IFC models');
    } finally {
      setLoading(false);
    }
  };

  const uploadIFCFile = async (file: File, modelData: Omit<CreateIFCModelData, 'file_path' | 'file_size'>): Promise<IFCModel | null> => {
    if (!user) return null;

    try {
      setUploading(true);
      
      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ifc-models')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading IFC file:', uploadError);
        toast.error('Failed to upload IFC file');
        return null;
      }

      // Create IFC model record
      const { data, error } = await supabase
        .from('ifc_models')
        .insert({
          ...modelData,
          user_id: user.id,
          file_path: uploadData.path,
          file_size: file.size,
          upload_status: 'completed'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating IFC model record:', error);
        toast.error('Failed to create IFC model record');
        return null;
      }

      toast.success('IFC model uploaded successfully');
      await fetchModels();
      return data as IFCModel;
    } catch (error) {
      console.error('Error uploading IFC file:', error);
      toast.error('Failed to upload IFC file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteModel = async (id: string): Promise<boolean> => {
    try {
      const model = models.find(m => m.id === id);
      if (!model) return false;

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('ifc-models')
        .remove([model.file_path]);

      if (storageError) {
        console.error('Error deleting IFC file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete model record
      const { error } = await supabase
        .from('ifc_models')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting IFC model:', error);
        toast.error('Failed to delete IFC model');
        return false;
      }

      toast.success('IFC model deleted successfully');
      await fetchModels();
      return true;
    } catch (error) {
      console.error('Error deleting IFC model:', error);
      toast.error('Failed to delete IFC model');
      return false;
    }
  };

  const getModelUrl = (model: IFCModel): string => {
    return `https://fjybggorcizszcpedjbb.supabase.co/storage/v1/object/public/ifc-models/${model.file_path}`;
  };

  useEffect(() => {
    if (user) {
      fetchModels();
    } else {
      setModels([]);
      setLoading(false);
    }
  }, [user, projectId]);

  // Real-time syncing
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('ifc-models-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ifc_models'
        },
        () => {
          fetchModels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId]);

  return {
    models,
    loading,
    uploading,
    fetchModels,
    uploadIFCFile,
    deleteModel,
    getModelUrl
  };
};