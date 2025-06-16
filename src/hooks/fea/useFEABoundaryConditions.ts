
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface FEABoundaryCondition {
  id: string;
  analysis_id: string;
  name: string;
  condition_type: 'fixed' | 'pinned' | 'roller' | 'spring' | 'contact';
  location: any;
  constraints: { x: boolean; y: boolean; z: boolean; rx: boolean; ry: boolean; rz: boolean };
  properties?: any;
  created_at: string;
}

export const useFEABoundaryConditions = () => {
  const [boundaryConditions, setBoundaryConditions] = useState<FEABoundaryCondition[]>([]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchBoundaryConditions = async (analysisId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('fea_boundary_conditions')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching FEA boundary conditions:', error);
        toast.error('Failed to load FEA boundary conditions');
        return;
      }

      setBoundaryConditions((data || []) as FEABoundaryCondition[]);
    } catch (error) {
      console.error('Error fetching FEA boundary conditions:', error);
      toast.error('Failed to load FEA boundary conditions');
    }
  };

  const createBoundaryConditionMutation = useMutation({
    mutationFn: async (bcData: {
      analysis_id: string;
      condition_type: 'fixed' | 'pinned' | 'roller' | 'spring' | 'contact';
      name: string;
      location: any;
      constraints: { x: boolean; y: boolean; z: boolean; rx: boolean; ry: boolean; rz: boolean };
      properties?: any;
    }) => {
      const { data, error } = await supabase
        .from('fea_boundary_conditions')
        .insert({
          ...bcData,
          properties: bcData.properties || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data as FEABoundaryCondition;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fea-boundary-conditions'] });
      toast.success('FEA boundary condition created successfully');
      fetchBoundaryConditions(data.analysis_id);
    },
    onError: (error: any) => {
      console.error('Error creating FEA boundary condition:', error);
      toast.error('Failed to create FEA boundary condition');
    },
  });

  const createBoundaryCondition = useCallback(async (bcData: Parameters<typeof createBoundaryConditionMutation.mutateAsync>[0]) => {
    if (!user) {
      toast.error('Please sign in to create FEA boundary condition');
      return null;
    }

    try {
      return await createBoundaryConditionMutation.mutateAsync(bcData);
    } catch (error) {
      console.error('Error creating FEA boundary condition:', error);
      return null;
    }
  }, [user, createBoundaryConditionMutation]);

  return {
    boundaryConditions,
    fetchBoundaryConditions,
    createBoundaryCondition,
    isCreating: createBoundaryConditionMutation.isPending,
  };
};
