
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTakeoffOperations } from './quantity-takeoff/useTakeoffOperations';
import type { QuantityTakeoff } from '@/types/cost-estimation';

export const useQuantityTakeoff = (estimationId?: string) => {
  const [takeoffs, setTakeoffs] = useState<QuantityTakeoff[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    generateTakeoffsFromElements,
    updateTakeoff,
    deleteTakeoff,
  } = useTakeoffOperations(estimationId);

  const fetchTakeoffs = async () => {
    if (!estimationId) return;

    try {
      const { data, error } = await supabase
        .from('quantity_takeoffs')
        .select(`
          *,
          bim_elements:element_id (name, element_type, geometry, parameters),
          materials:material_id (name, material_type, properties)
        `)
        .eq('estimation_id', estimationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map((item: any) => ({
        ...item,
        bim_elements: item.bim_elements || null,
        materials: item.materials || null,
      }));

      setTakeoffs(transformedData);
    } catch (error) {
      console.error('Error fetching quantity takeoffs:', error);
      toast.error('Failed to load quantity takeoffs');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTakeoffs = async (elements: any[]) => {
    await generateTakeoffsFromElements(elements);
    await fetchTakeoffs();
  };

  const handleUpdateTakeoff = async (id: string, updates: Partial<QuantityTakeoff>) => {
    await updateTakeoff(id, updates);
    await fetchTakeoffs();
  };

  const handleDeleteTakeoff = async (id: string) => {
    await deleteTakeoff(id);
    await fetchTakeoffs();
  };

  useEffect(() => {
    if (estimationId) {
      fetchTakeoffs();
    }
  }, [estimationId]);

  return {
    takeoffs,
    loading,
    generateTakeoffsFromElements: handleGenerateTakeoffs,
    updateTakeoff: handleUpdateTakeoff,
    deleteTakeoff: handleDeleteTakeoff,
    refreshTakeoffs: fetchTakeoffs,
  };
};
