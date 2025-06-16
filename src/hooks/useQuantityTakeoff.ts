
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { QuantityTakeoff } from '@/types/cost-estimation';

export const useQuantityTakeoff = (estimationId?: string) => {
  const [takeoffs, setTakeoffs] = useState<QuantityTakeoff[]>([]);
  const [loading, setLoading] = useState(true);

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

  const calculateQuantityFromElement = (element: any, material?: any): number => {
    const geometry = element.geometry || {};
    const elementType = element.element_type;

    switch (elementType) {
      case 'wall':
        const length = geometry.length || 0;
        const height = geometry.height || 0;
        const thickness = geometry.thickness || 0;
        return length * height * thickness; // Volume for concrete walls

      case 'slab':
        const width = geometry.width || 0;
        const slabLength = geometry.length || 0;
        const slabThickness = geometry.thickness || 0;
        return width * slabLength * slabThickness; // Volume

      case 'beam':
        const beamLength = geometry.length || 0;
        const crossSectionArea = geometry.cross_section_area || 0;
        return beamLength * crossSectionArea; // Volume

      case 'column':
        const columnHeight = geometry.height || 0;
        const columnArea = geometry.cross_section_area || 0;
        return columnHeight * columnArea; // Volume

      default:
        return 1; // Default quantity
    }
  };

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
      await fetchTakeoffs();
    } catch (error) {
      console.error('Error generating takeoffs:', error);
      toast.error('Failed to generate quantity takeoffs');
    }
  };

  const getUnitOfMeasureForElement = (elementType: string): string => {
    switch (elementType) {
      case 'wall':
      case 'slab':
      case 'beam':
      case 'column':
        return 'cy'; // Cubic yards for concrete elements
      case 'door':
      case 'window':
        return 'ea'; // Each for individual items
      case 'roof':
        return 'sf'; // Square feet for area
      default:
        return 'ea';
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
      await fetchTakeoffs();
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
      await fetchTakeoffs();
    } catch (error) {
      console.error('Error deleting takeoff:', error);
      toast.error('Failed to delete takeoff');
    }
  };

  useEffect(() => {
    if (estimationId) {
      fetchTakeoffs();
    }
  }, [estimationId]);

  return {
    takeoffs,
    loading,
    generateTakeoffsFromElements,
    updateTakeoff,
    deleteTakeoff,
    refreshTakeoffs: fetchTakeoffs,
  };
};
