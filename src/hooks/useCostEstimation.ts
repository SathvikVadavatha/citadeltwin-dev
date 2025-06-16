
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { CostEstimation, CostLineItem, CostSummary } from '@/types/cost-estimation';

export const useCostEstimation = (projectId?: string) => {
  const [estimations, setEstimations] = useState<CostEstimation[]>([]);
  const [currentEstimation, setCurrentEstimation] = useState<CostEstimation | null>(null);
  const [lineItems, setLineItems] = useState<CostLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();

  const fetchEstimations = async () => {
    if (!user || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('cost_estimations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEstimations(data || []);
    } catch (error) {
      console.error('Error fetching cost estimations:', error);
      toast.error('Failed to load cost estimations');
    } finally {
      setLoading(false);
    }
  };

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

  const createEstimation = async (estimationData: Partial<CostEstimation>) => {
    if (!user || !projectId) return null;

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('cost_estimations')
        .insert({
          ...estimationData,
          project_id: projectId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Cost estimation created successfully');
      await fetchEstimations();
      return data;
    } catch (error) {
      console.error('Error creating cost estimation:', error);
      toast.error('Failed to create cost estimation');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateEstimation = async (id: string, updates: Partial<CostEstimation>) => {
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('cost_estimations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Cost estimation updated successfully');
      await fetchEstimations();
      return data;
    } catch (error) {
      console.error('Error updating cost estimation:', error);
      toast.error('Failed to update cost estimation');
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const addLineItem = async (lineItemData: Partial<CostLineItem>) => {
    if (!currentEstimation) return null;

    try {
      const { data, error } = await supabase
        .from('cost_line_items')
        .insert({
          ...lineItemData,
          estimation_id: currentEstimation.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Line item added successfully');
      await fetchLineItems(currentEstimation.id);
      await updateEstimationTotals(currentEstimation.id);
      return data;
    } catch (error) {
      console.error('Error adding line item:', error);
      toast.error('Failed to add line item');
      return null;
    }
  };

  const updateLineItem = async (id: string, updates: Partial<CostLineItem>) => {
    if (!currentEstimation) return null;

    try {
      const { data, error } = await supabase
        .from('cost_line_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Line item updated successfully');
      await fetchLineItems(currentEstimation.id);
      await updateEstimationTotals(currentEstimation.id);
      return data;
    } catch (error) {
      console.error('Error updating line item:', error);
      toast.error('Failed to update line item');
      return null;
    }
  };

  const deleteLineItem = async (id: string) => {
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
      const { data: items, error } = await supabase
        .from('cost_line_items')
        .select('total_cost, total_labor_hours')
        .eq('estimation_id', estimationId);

      if (error) throw error;

      const totalCost = items?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;
      const totalLaborHours = items?.reduce((sum, item) => sum + (item.total_labor_hours || 0), 0) || 0;

      await supabase
        .from('cost_estimations')
        .update({ 
          total_estimated_cost: totalCost,
          estimated_duration_days: Math.ceil(totalLaborHours / 8) // Assuming 8-hour workdays
        })
        .eq('id', estimationId);

    } catch (error) {
      console.error('Error updating estimation totals:', error);
    }
  };

  const calculateCostSummary = (items: CostLineItem[], estimation: CostEstimation): CostSummary => {
    const materialCost = items.filter(item => item.category === 'material').reduce((sum, item) => sum + item.total_cost, 0);
    const laborCost = items.filter(item => item.category === 'labor').reduce((sum, item) => sum + item.total_cost, 0);
    const equipmentCost = items.filter(item => item.category === 'equipment').reduce((sum, item) => sum + item.total_cost, 0);
    
    const subtotal = materialCost + laborCost + equipmentCost;
    const markup = subtotal * (estimation.markup_percentage / 100);
    const contingency = (subtotal + markup) * (estimation.contingency_percentage / 100);
    const totalCost = subtotal + markup + contingency;
    
    const totalLaborHours = items.reduce((sum, item) => sum + item.total_labor_hours, 0);
    const estimatedDuration = Math.ceil(totalLaborHours / 8);

    return {
      totalMaterialCost: materialCost,
      totalLaborCost: laborCost,
      totalEquipmentCost: equipmentCost,
      subtotal,
      markup,
      contingency,
      totalCost,
      totalLaborHours,
      estimatedDuration,
    };
  };

  useEffect(() => {
    if (projectId && user) {
      fetchEstimations();
    }
  }, [projectId, user]);

  useEffect(() => {
    if (currentEstimation) {
      fetchLineItems(currentEstimation.id);
    }
  }, [currentEstimation]);

  return {
    estimations,
    currentEstimation,
    setCurrentEstimation,
    lineItems,
    loading,
    creating,
    updating,
    createEstimation,
    updateEstimation,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    calculateCostSummary,
    refreshEstimations: fetchEstimations,
  };
};
