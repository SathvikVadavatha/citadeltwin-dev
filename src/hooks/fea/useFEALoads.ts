
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FEALoad = Database['public']['Tables']['fea_loads']['Row'];

export interface CreateLoadData {
  analysis_id: string;
  load_type: Database['public']['Enums']['load_type'];
  name: string;
  magnitude: number;
  direction: { x: number; y: number; z: number };
  location: { x: number; y: number; z: number };
  properties?: any;
}

export const useFEALoads = () => {
  const [loads, setLoads] = useState<FEALoad[]>([]);

  const fetchLoads = useCallback(async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from('fea_loads')
        .select('*')
        .eq('analysis_id', analysisId);

      if (error) throw error;
      setLoads(data || []);
    } catch (error) {
      console.error('Error fetching loads:', error);
      toast.error('Failed to load analysis data');
    }
  }, []);

  const createLoad = useCallback(async (loadData: CreateLoadData): Promise<FEALoad | null> => {
    try {
      const { data, error } = await supabase
        .from('fea_loads')
        .insert(loadData)
        .select()
        .single();

      if (error) {
        console.error('Error creating load:', error);
        toast.error('Failed to create load');
        return null;
      }

      toast.success('Load created successfully');
      await fetchLoads(loadData.analysis_id);
      return data;
    } catch (error) {
      console.error('Error creating load:', error);
      toast.error('Failed to create load');
      return null;
    }
  }, [fetchLoads]);

  return {
    loads,
    fetchLoads,
    createLoad,
  };
};
