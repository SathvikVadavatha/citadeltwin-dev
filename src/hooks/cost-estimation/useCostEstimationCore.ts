
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            SELECT * FROM cost_estimations 
            WHERE project_id = '${projectId}' 
            ORDER BY created_at DESC
          `
        }
      });

      if (error) throw error;
      setEstimations(data.data || []);
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
      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            INSERT INTO cost_estimations (
              project_id, name, description, status, markup_percentage, 
              contingency_percentage, labor_rate_per_hour, created_by
            ) VALUES (
              '${projectId}', 
              '${estimationData.name}', 
              '${estimationData.description || ''}', 
              'draft', 
              ${estimationData.markup_percentage || 15}, 
              ${estimationData.contingency_percentage || 10}, 
              ${estimationData.labor_rate_per_hour || 45}, 
              '${user.id}'
            ) RETURNING *
          `
        }
      });

      if (error) throw error;

      const newEstimation = data.data?.[0];
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
      const updateFields = Object.entries(updates)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(', ');

      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            UPDATE cost_estimations 
            SET ${updateFields}, updated_at = NOW()
            WHERE id = '${id}' 
            RETURNING *
          `
        }
      });

      if (error) throw error;

      toast.success('Cost estimation updated successfully');
      await fetchEstimations();
      return data.data?.[0] || null;
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
