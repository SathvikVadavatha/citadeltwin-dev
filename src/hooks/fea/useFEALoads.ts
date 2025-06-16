
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface FEALoad {
  id: string;
  analysis_id: string;
  name: string;
  load_type: 'point' | 'distributed' | 'pressure' | 'thermal' | 'body';
  magnitude: number;
  direction: { x: number; y: number; z: number };
  location: { x: number; y: number; z: number };
  properties?: any;
  created_at: string;
}

export const useFEALoads = () => {
  const [loads, setLoads] = useState<FEALoad[]>([]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchLoads = async (analysisId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('fea_loads')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching FEA loads:', error);
        toast.error('Failed to load FEA loads');
        return;
      }

      setLoads((data || []) as FEALoad[]);
    } catch (error) {
      console.error('Error fetching FEA loads:', error);
      toast.error('Failed to load FEA loads');
    }
  };

  const createLoadMutation = useMutation({
    mutationFn: async (loadData: {
      analysis_id: string;
      load_type: 'point' | 'distributed' | 'pressure' | 'thermal' | 'body';
      name: string;
      magnitude: number;
      direction: { x: number; y: number; z: number };
      location: { x: number; y: number; z: number };
      properties?: any;
    }) => {
      const { data, error } = await supabase
        .from('fea_loads')
        .insert({
          ...loadData,
          properties: loadData.properties || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data as FEALoad;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fea-loads'] });
      toast.success('FEA load created successfully');
      fetchLoads(data.analysis_id);
    },
    onError: (error: any) => {
      console.error('Error creating FEA load:', error);
      toast.error('Failed to create FEA load');
    },
  });

  const createLoad = useCallback(async (loadData: Parameters<typeof createLoadMutation.mutateAsync>[0]) => {
    if (!user) {
      toast.error('Please sign in to create FEA load');
      return null;
    }

    try {
      return await createLoadMutation.mutateAsync(loadData);
    } catch (error) {
      console.error('Error creating FEA load:', error);
      return null;
    }
  }, [user, createLoadMutation]);

  return {
    loads,
    fetchLoads,
    createLoad,
    isCreating: createLoadMutation.isPending,
  };
};
