
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CostLineItem, CostEstimation } from '@/types/cost-estimation';

export const useLineItems = (currentEstimation: CostEstimation | null) => {
  const [lineItems, setLineItems] = useState<CostLineItem[]>([]);

  const fetchLineItems = async (estimationId: string) => {
    try {
      const { data, error } = await supabase
        .from('cost_line_items')
        .select('*')
        .eq('estimation_id', estimationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLineItems(data || []);
    } catch (error) {
      console.error('Error fetching line items:', error);
      toast.error('Failed to load line items');
    }
  };

  const addLineItem = async (lineItemData: Partial<CostLineItem>): Promise<CostLineItem | null> => {
    if (!currentEstimation) return null;

    try {
      const { data, error } = await supabase
        .from('cost_line_items')
        .insert({
          estimation_id: currentEstimation.id,
          item_description: lineItemData.item_description,
          category: lineItemData.category,
          quantity: lineItemData.quantity,
          unit_of_measure: lineItemData.unit_of_measure,
          unit_cost: lineItemData.unit_cost,
          total_cost: lineItemData.total_cost,
          labor_hours_per_unit: lineItemData.labor_hours_per_unit || 0,
          total_labor_hours: lineItemData.total_labor_hours || 0,
          waste_factor: lineItemData.waste_factor || 0,
          notes: lineItemData.notes || '',
          cost_database_source: lineItemData.cost_database_source || 'custom',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Line item added successfully');
      await fetchLineItems(currentEstimation.id);
      await updateEstimationTotals(currentEstimation.id);
      return data || null;
    } catch (error) {
      console.error('Error adding line item:', error);
      toast.error('Failed to add line item');
      return null;
    }
  };

  const updateLineItem = async (id: string, updates: Partial<CostLineItem>): Promise<CostLineItem | null> => {
    if (!currentEstimation) return null;

    try {
      const { data, error } = await supabase
        .from('cost_line_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Line item updated successfully');
      await fetchLineItems(currentEstimation.id);
      await updateEstimationTotals(currentEstimation.id);
      return data || null;
    } catch (error) {
      console.error('Error updating line item:', error);
      toast.error('Failed to update line item');
      return null;
    }
  };

  const deleteLineItem = async (id: string): Promise<boolean> => {
    if (!currentEstimation) return false;

    try {
      const { error } = await supabase
        .from('cost_line_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Line item deleted successfully');
      await fetchLineItems(currentEstimation.id);
      await updateEstimationTotals(currentEstimation.id);
      return true;
    } catch (error) {
      console.error('Error deleting line item:', error);
      toast.error('Failed to delete line item');
      return false;
    }
  };

  const updateEstimationTotals = async (estimationId: string) => {
    try {
      const { data, error } = await supabase
        .from('cost_line_items')
        .select('total_cost, total_labor_hours')
        .eq('estimation_id', estimationId);

      if (error) throw error;

      const totalCost = (data || []).reduce((sum, item) => sum + (item.total_cost || 0), 0);
      const totalLaborHours = (data || []).reduce((sum, item) => sum + (item.total_labor_hours || 0), 0);
      const estimatedDuration = Math.ceil(totalLaborHours / 8);

      await supabase
        .from('cost_estimations')
        .update({
          total_estimated_cost: totalCost,
          estimated_duration_days: estimatedDuration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', estimationId);
    } catch (error) {
      console.error('Error updating estimation totals:', error);
    }
  };

  useEffect(() => {
    if (currentEstimation) {
      fetchLineItems(currentEstimation.id);
    }
  }, [currentEstimation]);

  return {
    lineItems,
    addLineItem,
    updateLineItem,
    deleteLineItem,
  };
};
