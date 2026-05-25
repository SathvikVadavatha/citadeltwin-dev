
import { useState, useEffect } from 'react';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
const supabase = supabaseClient as any;
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { CostEstimation } from '@/types/cost-estimation';

export const useCostEstimationCore = (projectId?: string) => {
  const [estimations, setEstimations] = useState<CostEstimation[]>([]);
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

  const createEstimation = async (estimationData: Partial<CostEstimation>): Promise<CostEstimation | null> => {
    if (!user || !projectId) return null;

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('cost_estimations')
        .insert({
          project_id: projectId,
          name: estimationData.name,
          description: estimationData.description || '',
          status: 'draft',
          markup_percentage: estimationData.markup_percentage || 15,
          contingency_percentage: estimationData.contingency_percentage || 10,
          labor_rate_per_hour: estimationData.labor_rate_per_hour || 45,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newEstimation = data;
      if (newEstimation) {
        toast.success('Cost estimation created successfully');
        await fetchEstimations();
        return newEstimation;
      }
      return null;
    } catch (error) {
      console.error('Error creating cost estimation:', error);
      toast.error('Failed to create cost estimation');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateEstimation = async (id: string, updates: Partial<CostEstimation>): Promise<CostEstimation | null> => {
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('cost_estimations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Cost estimation updated successfully');
      await fetchEstimations();
      return data || null;
    } catch (error) {
      console.error('Error updating cost estimation:', error);
      toast.error('Failed to update cost estimation');
      return null;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (projectId && user) {
      fetchEstimations();
    }
  }, [projectId, user]);

  return {
    estimations,
    loading,
    creating,
    updating,
    createEstimation,
    updateEstimation,
    refreshEstimations: fetchEstimations,
  };
};
