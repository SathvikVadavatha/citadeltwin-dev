
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FEAResult = Database['public']['Tables']['fea_results']['Row'];

export const useFEAResults = () => {
  const [results, setResults] = useState<FEAResult[]>([]);

  const fetchResults = useCallback(async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from('fea_results')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load analysis data');
    }
  }, []);

  return {
    results,
    fetchResults,
  };
};
