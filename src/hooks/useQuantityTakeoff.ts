
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
      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            SELECT 
              qt.*,
              be.name as element_name,
              be.element_type,
              be.geometry,
              be.parameters,
              m.name as material_name,
              m.material_type,
              m.properties as material_properties
            FROM quantity_takeoffs qt
            LEFT JOIN bim_elements be ON qt.element_id = be.id
            LEFT JOIN materials m ON qt.material_id = m.id
            WHERE qt.estimation_id = '${estimationId}'
            ORDER BY qt.created_at ASC
          `
        }
      });

      if (error) throw error;

      // Transform the data to match our expected structure
      const transformedData = (data.data || []).map((item: any) => ({
        ...item,
        bim_elements: item.element_name ? {
          name: item.element_name,
          element_type: item.element_type,
          geometry: item.geometry,
          parameters: item.parameters
        } : null,
        materials: item.material_name ? {
          name: item.material_name,
          material_type: item.material_type,
          properties: item.material_properties
        } : null
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
