
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FEABoundaryCondition = Database['public']['Tables']['fea_boundary_conditions']['Row'];

export interface CreateBoundaryConditionData {
  analysis_id: string;
  condition_type: Database['public']['Enums']['boundary_condition_type'];
  name: string;
  location: any;
  constraints: { x: boolean; y: boolean; z: boolean; rx: boolean; ry: boolean; rz: boolean };
  properties?: any;
}

export const useFEABoundaryConditions = () => {
  const [boundaryConditions, setBoundaryConditions] = useState<FEABoundaryCondition[]>([]);

  const fetchBoundaryConditions = useCallback(async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from('fea_boundary_conditions')
        .select('*')
        .eq('analysis_id', analysisId);

      if (error) throw error;
      setBoundaryConditions(data || []);
    } catch (error) {
      console.error('Error fetching boundary conditions:', error);
      toast.error('Failed to load analysis data');
    }
  }, []);

  const createBoundaryCondition = useCallback(async (bcData: CreateBoundaryConditionData): Promise<FEABoundaryCondition | null> => {
    try {
      const { data, error } = await supabase
        .from('fea_boundary_conditions')
        .insert(bcData)
        .select()
        .single();

      if (error) {
        console.error('Error creating boundary condition:', error);
        toast.error('Failed to create boundary condition');
        return null;
      }

      toast.success('Boundary condition created successfully');
      await fetchBoundaryConditions(bcData.analysis_id);
      return data;
    } catch (error) {
      console.error('Error creating boundary condition:', error);
      toast.error('Failed to create boundary condition');
      return null;
    }
  }, [fetchBoundaryConditions]);

  return {
    boundaryConditions,
    fetchBoundaryConditions,
    createBoundaryCondition,
  };
};
