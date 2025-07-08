
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useErrorHandler } from '@/utils/errorHandling';
import type { Database } from '@/integrations/supabase/types';

type Material = Database['public']['Tables']['materials']['Row'];

export interface CreateMaterialData {
  name: string;
  material_type: Database['public']['Enums']['material_type'];
  properties?: {
    thermal_conductivity?: number;
    density?: number;
    compressive_strength?: number;
    tensile_strength?: number;
    youngs_modulus?: number;
    poisson_ratio?: number;
    [key: string]: any;
  };
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
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { withErrorHandling } = useErrorHandler();

  const fetchMaterials = async () => {
    return withErrorHandling(async () => {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      
      setMaterials(data || []);
    }, 'Fetching materials');
  };

  const createMaterial = async (materialData: CreateMaterialData): Promise<Material | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    return withErrorHandling(async () => {
      setCreating(true);
      setError(null);
      
      const { data, error: createError } = await supabase
        .from('materials')
        .insert({
          ...materialData,
          properties: materialData.properties || {},
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchMaterials();
      return data;
    }, 'Creating material');
  };

  const updateMaterial = async (id: string, updates: Partial<CreateMaterialData>): Promise<Material | null> => {
    return withErrorHandling(async () => {
      setUpdating(true);
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchMaterials();
      return data;
    }, 'Updating material');
  };

  const deleteMaterial = async (id: string): Promise<boolean> => {
    const result = await withErrorHandling(async () => {
      setDeleting(true);
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchMaterials();
      return true;
    }, 'Deleting material');

    return result ?? false;
  };

  useEffect(() => {
    if (user) {
      fetchMaterials().finally(() => setLoading(false));
    }
  }, [user]);

  // Real-time syncing
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('materials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materials'
        },
        () => {
          fetchMaterials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Reset loading states after operations
  useEffect(() => {
    if (!loading) {
      setCreating(false);
      setUpdating(false);
      setDeleting(false);
    }
  }, [loading]);

  return {
    materials,
    loading,
    creating,
    updating,
    deleting,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    refreshMaterials: fetchMaterials,
  };
};
