
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateQuantityFromElement, getUnitOfMeasureForElement } from './useQuantityCalculations';
import type { QuantityTakeoff } from '@/types/cost-estimation';

export const useTakeoffOperations = (estimationId?: string) => {
  const generateTakeoffsFromElements = async (elements: any[]) => {
    if (!estimationId) return;

    try {
      const rows = elements.map(element => {
        const quantity = calculateQuantityFromElement(element);
        const unitOfMeasure = getUnitOfMeasureForElement(element.element_type);

        return {
          estimation_id: estimationId,
          element_id: element.id,
          material_id: element.material_id || null,
          calculated_quantity: quantity,
          unit_of_measure: unitOfMeasure,
          calculation_method: 'automated_geometry',
          geometry_data: element.geometry || {},
        };
      });

      const { error } = await supabase
        .from('quantity_takeoffs')
        .insert(rows);
    } catch (error) {
      console.error('Error generating takeoffs:', error);
      toast.error('Failed to generate quantity takeoffs');
    }
  };

  const updateTakeoff = async (id: string, updates: Partial<QuantityTakeoff>) => {
    try {
      const { error } = await supabase
        .from('quantity_takeoffs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Takeoff updated successfully');
    } catch (error) {
      console.error('Error updating takeoff:', error);
      toast.error('Failed to update takeoff');
    }
  };

  const deleteTakeoff = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quantity_takeoffs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Takeoff deleted successfully');
    } catch (error) {
      console.error('Error deleting takeoff:', error);
      toast.error('Failed to delete takeoff');
    }
  };

  return {
    generateTakeoffsFromElements,
    updateTakeoff,
    deleteTakeoff,
  };
};
