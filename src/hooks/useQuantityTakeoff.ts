
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
      const { data, error } = await supabase
        .from('quantity_takeoffs')
        .select(`
          *,
          bim_elements(name, element_type, geometry, parameters),
          materials(name, material_type, properties)
        `)
        .eq('estimation_id', estimationId);

      if (error) throw error;
      setTakeoffs(data || []);
    } catch (error) {
      console.error('Error fetching quantity takeoffs:', error);
      toast.error('Failed to load quantity takeoffs');
    } finally {
      setLoading(false);
    }
  };

  const calculateQuantityFromElement = (element: any, material?: any): number => {
    // Basic quantity calculation based on element geometry
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
      const takeoffData = elements.map(element => {
        const quantity = calculateQuantityFromElement(element);
        const unitOfMeasure = getUnitOfMeasureForElement(element.element_type);

        return {
          estimation_id: estimationId,
          element_id: element.id,
          material_id: element.material_id,
          calculated_quantity: quantity,
          unit_of_measure: unitOfMeasure,
          calculation_method: 'automated_geometry',
          geometry_data: element.geometry,
        };
      });

      const { error } = await supabase
        .from('quantity_takeoffs')
        .insert(takeoffData);

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
      const { error } = await supabase
        .from('quantity_takeoffs')
        .update(updates)
        .eq('id', id);

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
      const { error } = await supabase
        .from('quantity_takeoffs')
        .delete()
        .eq('id', id);

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
