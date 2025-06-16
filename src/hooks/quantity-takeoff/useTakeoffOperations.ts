
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateQuantityFromElement, getUnitOfMeasureForElement } from './useQuantityCalculations';
import type { QuantityTakeoff } from '@/types/cost-estimation';

export const useTakeoffOperations = (estimationId?: string) => {
  const generateTakeoffsFromElements = async (elements: any[]) => {
    if (!estimationId) return;

    try {
      const takeoffInserts = elements.map(element => {
        const quantity = calculateQuantityFromElement(element);
        const unitOfMeasure = getUnitOfMeasureForElement(element.element_type);

        return `(
          '${estimationId}',
          '${element.id}',
          ${element.material_id ? `'${element.material_id}'` : 'NULL'},
          ${quantity},
          '${unitOfMeasure}',
          'automated_geometry',
          '${JSON.stringify(element.geometry || {}).replace(/'/g, "''")}'
        )`;
      }).join(',');

      const { error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            INSERT INTO quantity_takeoffs (
              estimation_id, element_id, material_id, calculated_quantity, 
              unit_of_measure, calculation_method, geometry_data
            ) VALUES ${takeoffInserts}
          `
        }
      });

      if (error) throw error;

      toast.success('Quantity takeoffs generated successfully');
    } catch (error) {
      console.error('Error generating takeoffs:', error);
      toast.error('Failed to generate quantity takeoffs');
    }
  };

  const updateTakeoff = async (id: string, updates: Partial<QuantityTakeoff>) => {
    try {
      const updateFields = Object.entries(updates)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value}'` : value}`)
        .join(', ');

      const { error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            UPDATE quantity_takeoffs 
            SET ${updateFields}, updated_at = NOW()
            WHERE id = '${id}'
          `
        }
      });

      if (error) throw error;

      toast.success('Takeoff updated successfully');
    } catch (error) {
      console.error('Error updating takeoff:', error);
      toast.error('Failed to update takeoff');
    }
  };

  const deleteTakeoff = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `DELETE FROM quantity_takeoffs WHERE id = '${id}'`
        }
      });

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
