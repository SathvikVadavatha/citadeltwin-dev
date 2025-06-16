
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type BIMElement = Database['public']['Tables']['bim_elements']['Row'];

export const useBIMElements = (uploadId?: string) => {
  const [elements, setElements] = useState<BIMElement[]>([]);
  const [loading, setLoading] = useState(true);
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
          )
        `)
        .order('created_at', { ascending: false });

      if (uploadId) {
        query = query.eq('upload_id', uploadId);
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
  }, [user, uploadId]);

  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  const createElement = useCallback(async (elementData: Partial<BIMElement>): Promise<BIMElement | null> => {
    try {
      const { data, error } = await supabase
        .from('bim_elements')
        .insert(elementData)
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
    }
  }, [fetchElements]);

  const updateElement = useCallback(async (id: string, updates: Partial<BIMElement>): Promise<boolean> => {
    try {
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
    }
  }, [fetchElements]);

  const deleteElement = useCallback(async (id: string): Promise<boolean> => {
    try {
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
    }
  }, [fetchElements]);

  return {
    elements,
    loading,
    fetchElements,
    createElement,
    updateElement,
    deleteElement,
  };
};
