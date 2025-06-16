
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CostLineItem, CostEstimation } from '@/types/cost-estimation';

export const useLineItems = (currentEstimation: CostEstimation | null) => {
  const [lineItems, setLineItems] = useState<CostLineItem[]>([]);

  const fetchLineItems = async (estimationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            SELECT * FROM cost_line_items 
            WHERE estimation_id = '${estimationId}' 
            ORDER BY created_at ASC
          `
        }
      });

      if (error) throw error;
      setLineItems(data.data || []);
    } catch (error) {
      console.error('Error fetching line items:', error);
      toast.error('Failed to load line items');
    }
  };

  const addLineItem = async (lineItemData: Partial<CostLineItem>): Promise<CostLineItem | null> => {
    if (!currentEstimation) return null;

    try {
      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            INSERT INTO cost_line_items (
              estimation_id, item_description, category, quantity, unit_of_measure,
              unit_cost, total_cost, labor_hours_per_unit, total_labor_hours, 
              waste_factor, notes, cost_database_source
            ) VALUES (
              '${currentEstimation.id}',
              '${lineItemData.item_description}',
              '${lineItemData.category}',
              ${lineItemData.quantity},
              '${lineItemData.unit_of_measure}',
              ${lineItemData.unit_cost},
              ${lineItemData.total_cost},
              ${lineItemData.labor_hours_per_unit || 0},
              ${lineItemData.total_labor_hours || 0},
              ${lineItemData.waste_factor || 0},
              '${lineItemData.notes || ''}',
              '${lineItemData.cost_database_source || 'custom'}'
            ) RETURNING *
          `
        }
      });

      if (error) throw error;

      toast.success('Line item added successfully');
      await fetchLineItems(currentEstimation.id);
      await updateEstimationTotals(currentEstimation.id);
      return data.data?.[0] || null;
    } catch (error) {
      console.error('Error adding line item:', error);
      toast.error('Failed to add line item');
      return null;
    }
  };

  const updateLineItem = async (id: string, updates: Partial<CostLineItem>): Promise<CostLineItem | null> => {
    if (!currentEstimation) return null;

    try {
      const updateFields = Object.entries(updates)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value}'` : value}`)
        .join(', ');

      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            UPDATE cost_line_items 
            SET ${updateFields}, updated_at = NOW()
            WHERE id = '${id}' 
            RETURNING *
          `
        }
      });

      if (error) throw error;

      toast.success('Line item updated successfully');
      await fetchLineItems(currentEstimation.id);
      await updateEstimationTotals(currentEstimation.id);
      return data.data?.[0] || null;
    } catch (error) {
      console.error('Error updating line item:', error);
      toast.error('Failed to update line item');
      return null;
    }
  };

  const deleteLineItem = async (id: string): Promise<boolean> => {
    if (!currentEstimation) return false;

    try {
      const { error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `DELETE FROM cost_line_items WHERE id = '${id}'`
        }
      });

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
      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            SELECT 
              SUM(total_cost) as total_cost,
              SUM(total_labor_hours) as total_labor_hours
            FROM cost_line_items 
            WHERE estimation_id = '${estimationId}'
          `
        }
      });

      if (error) throw error;

      const totals = data.data?.[0];
      if (totals) {
        const totalCost = totals.total_cost || 0;
        const totalLaborHours = totals.total_labor_hours || 0;
        const estimatedDuration = Math.ceil(totalLaborHours / 8);

        await supabase.functions.invoke('exec-sql', {
          body: {
            sql: `
              UPDATE cost_estimations 
              SET 
                total_estimated_cost = ${totalCost},
                estimated_duration_days = ${estimatedDuration},
                updated_at = NOW()
              WHERE id = '${estimationId}'
            `
          }
        });
      }
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
