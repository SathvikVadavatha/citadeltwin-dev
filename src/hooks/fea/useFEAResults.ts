
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface FEAResult {
  id: string;
  analysis_id: string;
  result_type: string;
  data: any;
  metadata?: any;
  file_path?: string;
  created_at: string;
}

export const useFEAResults = () => {
  const [results, setResults] = useState<FEAResult[]>([]);
  const { user } = useAuth();

  const fetchResults = async (analysisId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('fea_results')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching FEA results:', error);
        toast.error('Failed to load FEA results');
        return;
      }

      setResults((data || []) as FEAResult[]);
    } catch (error) {
      console.error('Error fetching FEA results:', error);
      toast.error('Failed to load FEA results');
    }
  };

  return {
    results,
    fetchResults,
  };
};
