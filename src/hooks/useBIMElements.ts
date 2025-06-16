
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type BIMElement = Database['public']['Tables']['bim_elements']['Row'] & {
  materials?: Database['public']['Tables']['materials']['Row'];
  parent_element?: Database['public']['Tables']['bim_elements']['Row'];
};

export type { BIMElement };

export interface CreateBIMElementData {
  upload_id?: string;
  project_id?: string;
  element_type: Database['public']['Enums']['element_type'];
  name: string;
  description?: string;
  geometry: any;
  parameters?: any;
  material_id?: string;
  parent_element_id?: string;
}

export const useBIMElements = (filterId?: string, filterType: 'upload' | 'project' = 'upload') => {
  const [elements, setElements] = useState<BIMElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const fetchElements = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('bim_elements')
        .select(`
          *,
          materials (
            id,
            name,
            properties
          ),
          parent_element:bim_elements!parent_element_id (
            id,
            name,
            element_type
          )
        `)
        .order('created_at', { ascending: false });

      if (filterId) {
        if (filterType === 'upload') {
          query = query.eq('upload_id', filterId);
        } else {
          query = query.eq('project_id', filterId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching BIM elements:', error);
        toast.error('Failed to load BIM elements');
        return;
      }

      setElements(data || []);
    } catch (error) {
      console.error('Error fetching BIM elements:', error);
      toast.error('Failed to load BIM elements');
    } finally {
      setLoading(false);
    }
  }, [user, filterId, filterType]);

  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  const createElement = useCallback(async (elementData: CreateBIMElementData): Promise<BIMElement | null> => {
    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('bim_elements')
        .insert({
          ...elementData,
          element_type: elementData.element_type,
          name: elementData.name,
          geometry: elementData.geometry,
          parameters: elementData.parameters || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating BIM element:', error);
        toast.error('Failed to create BIM element');
        return null;
      }

      toast.success('BIM element created successfully');
      await fetchElements();
      return data;
    } catch (error) {
      console.error('Error creating BIM element:', error);
      toast.error('Failed to create BIM element');
      return null;
    } finally {
      setCreating(false);
    }
  }, [fetchElements]);

  const updateElement = useCallback(async (id: string, updates: Partial<BIMElement>): Promise<boolean> => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('bim_elements')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating BIM element:', error);
        toast.error('Failed to update BIM element');
        return false;
      }

      toast.success('BIM element updated successfully');
      await fetchElements();
      return true;
    } catch (error) {
      console.error('Error updating BIM element:', error);
      toast.error('Failed to update BIM element');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [fetchElements]);

  const deleteElement = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('bim_elements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting BIM element:', error);
        toast.error('Failed to delete BIM element');
        return false;
      }

      toast.success('BIM element deleted successfully');
      await fetchElements();
      return true;
    } catch (error) {
      console.error('Error deleting BIM element:', error);
      toast.error('Failed to delete BIM element');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [fetchElements]);

  const duplicateElement = useCallback(async (id: string): Promise<boolean> => {
    try {
      const elementToDuplicate = elements.find(el => el.id === id);
      if (!elementToDuplicate) return false;

      const duplicateData: CreateBIMElementData = {
        upload_id: elementToDuplicate.upload_id || undefined,
        project_id: elementToDuplicate.project_id || undefined,
        element_type: elementToDuplicate.element_type,
        name: `${elementToDuplicate.name} (Copy)`,
        description: elementToDuplicate.description || undefined,
        geometry: elementToDuplicate.geometry,
        parameters: elementToDuplicate.parameters,
        material_id: elementToDuplicate.material_id || undefined,
        parent_element_id: elementToDuplicate.parent_element_id || undefined,
      };

      await createElement(duplicateData);
      return true;
    } catch (error) {
      console.error('Error duplicating BIM element:', error);
      toast.error('Failed to duplicate BIM element');
      return false;
    }
  }, [elements, createElement]);

  const refreshElements = useCallback(() => {
    fetchElements();
  }, [fetchElements]);

  return {
    elements,
    loading,
    creating,
    updating,
    deleting,
    fetchElements,
    refreshElements,
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
  };
};
