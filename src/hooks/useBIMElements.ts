
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

// Extended BIM Element type to include project_id
export interface BIMElement {
  id: string;
  upload_id?: string;
  project_id?: string;
  element_type: 'wall' | 'beam' | 'column' | 'slab' | 'door' | 'window' | 'roof' | 'foundation' | 'stair' | 'railing' | 'mechanical' | 'electrical' | 'plumbing' | 'structural' | 'architectural';
  name: string;
  description?: string;
  geometry: any;
  parameters?: any;
  material_id?: string;
  parent_element_id?: string;
  created_at: string;
  updated_at: string;
  materials?: {
    id: string;
    name: string;
    material_type: string;
    properties: any;
  };
  parent_element?: {
    id: string;
    name: string;
    element_type: string;
  };
}

export interface CreateBIMElementData {
  upload_id?: string;
  project_id?: string;
  element_type: 'wall' | 'beam' | 'column' | 'slab' | 'door' | 'window' | 'roof' | 'foundation' | 'stair' | 'railing' | 'mechanical' | 'electrical' | 'plumbing' | 'structural' | 'architectural';
  name: string;
  description?: string;
  geometry: any;
  parameters?: any;
  material_id?: string;
  parent_element_id?: string;
}

export const useBIMElements = (projectIdOrUploadId?: string, filterType: 'project' | 'upload' = 'upload') => {
  const [elements, setElements] = useState<BIMElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const fetchElements = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let query = (supabase as any)
        .from('bim_elements')
        .select(`
          *,
          materials (
            id,
            name,
            material_type,
            properties
          ),
          parent_element:bim_elements!parent_element_id (
            id,
            name,
            element_type
          )
        `)
        .order('created_at', { ascending: false });

      if (projectIdOrUploadId) {
        if (filterType === 'project') {
          query = query.eq('project_id', projectIdOrUploadId);
        } else {
          query = query.eq('upload_id', projectIdOrUploadId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching BIM elements:', error);
        toast.error('Failed to load BIM elements');
        return;
      }

      setElements((data || []) as BIMElement[]);
    } catch (error) {
      console.error('Error fetching BIM elements:', error);
      toast.error('Failed to load BIM elements');
    } finally {
      setLoading(false);
    }
  };

  const createElement = async (elementData: CreateBIMElementData): Promise<BIMElement | null> => {
    if (!user) return null;

    try {
      setCreating(true);
      const { data, error } = await (supabase as any)
        .from('bim_elements')
        .insert({
          ...elementData,
          geometry: elementData.geometry || {},
          parameters: elementData.parameters || {},
        })
        .select(`
          *,
          materials (
            id,
            name,
            material_type,
            properties
          )
        `)
        .single();

      if (error) {
        console.error('Error creating BIM element:', error);
        toast.error('Failed to create BIM element');
        return null;
      }

      toast.success('BIM element created successfully');
      await fetchElements();
      return data as BIMElement;
    } catch (error) {
      console.error('Error creating BIM element:', error);
      toast.error('Failed to create BIM element');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateElement = async (id: string, updates: Partial<CreateBIMElementData>): Promise<BIMElement | null> => {
    try {
      setUpdating(true);
      const { data, error } = await (supabase as any)
        .from('bim_elements')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          materials (
            id,
            name,
            material_type,
            properties
          )
        `)
        .single();

      if (error) {
        console.error('Error updating BIM element:', error);
        toast.error('Failed to update BIM element');
        return null;
      }

      toast.success('BIM element updated successfully');
      await fetchElements();
      return data as BIMElement;
    } catch (error) {
      console.error('Error updating BIM element:', error);
      toast.error('Failed to update BIM element');
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const deleteElement = async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      const { error } = await (supabase as any)
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
  };

  const duplicateElement = async (id: string): Promise<BIMElement | null> => {
    const element = elements.find(el => el.id === id);
    if (!element) return null;

    const duplicateData: CreateBIMElementData = {
      upload_id: element.upload_id || undefined,
      project_id: element.project_id || undefined,
      element_type: element.element_type,
      name: `${element.name} (Copy)`,
      description: element.description || undefined,
      geometry: element.geometry,
      parameters: element.parameters,
      material_id: element.material_id || undefined,
      parent_element_id: element.parent_element_id || undefined,
    };

    return await createElement(duplicateData);
  };

  useEffect(() => {
    if (user) {
      fetchElements();
    } else {
      setElements([]);
      setLoading(false);
    }
  }, [user, projectIdOrUploadId, filterType]);

  return {
    elements,
    loading,
    creating,
    updating,
    deleting,
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
    refreshElements: fetchElements,
  };
};
