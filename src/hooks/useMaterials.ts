
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Material = Database['public']['Tables']['materials']['Row'];
type MaterialInsert = Database['public']['Tables']['materials']['Insert'];

export interface CreateMaterialData {
  name: string;
  material_type: Database['public']['Enums']['material_type'];
  properties?: any;
  cost_per_unit?: number;
  unit?: string;
  supplier?: string;
}

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching materials:', error);
        toast.error('Failed to load materials');
        return;
      }

      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const createMaterial = async (materialData: CreateMaterialData): Promise<Material | null> => {
    if (!user) return null;

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('materials')
        .insert({
          ...materialData,
          properties: materialData.properties || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating material:', error);
        toast.error('Failed to create material');
        return null;
      }

      toast.success('Material created successfully');
      await fetchMaterials();
      return data;
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error('Failed to create material');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateMaterial = async (id: string, updates: Partial<CreateMaterialData>): Promise<Material | null> => {
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating material:', error);
        toast.error('Failed to update material');
        return null;
      }

      toast.success('Material updated successfully');
      await fetchMaterials();
      return data;
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material');
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const deleteMaterial = async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting material:', error);
        toast.error('Failed to delete material');
        return false;
      }

      toast.success('Material deleted successfully');
      await fetchMaterials();
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return {
    materials,
    loading,
    creating,
    updating,
    deleting,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    refreshMaterials: fetchMaterials,
  };
};
