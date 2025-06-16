
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FEAAnalysis = Database['public']['Tables']['fea_analyses']['Row'];

export interface CreateAnalysisData {
  upload_id?: string;
  element_id?: string;
  name: string;
  description?: string;
  analysis_type: Database['public']['Enums']['analysis_type'];
  input_parameters?: any;
}

export const useFEAAnalysisCore = (elementId?: string) => {
  const [analyses, setAnalyses] = useState<FEAAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAnalyses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('fea_analyses')
        .select(`
          *,
          bim_elements (
            id,
            name,
            element_type
          )
        `)
        .order('created_at', { ascending: false });

      if (elementId) {
        query = query.eq('element_id', elementId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching FEA analyses:', error);
        toast.error('Failed to load FEA analyses');
        return;
      }

      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching FEA analyses:', error);
      toast.error('Failed to load FEA analyses');
    } finally {
      setLoading(false);
    }
  }, [user, elementId]);

  const createAnalysis = useCallback(async (analysisData: CreateAnalysisData): Promise<FEAAnalysis | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('fea_analyses')
        .insert({
          ...analysisData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating FEA analysis:', error);
        toast.error('Failed to create FEA analysis');
        return null;
      }

      toast.success('FEA analysis created successfully');
      await fetchAnalyses();
      return data;
    } catch (error) {
      console.error('Error creating FEA analysis:', error);
      toast.error('Failed to create FEA analysis');
      return null;
    }
  }, [user, fetchAnalyses]);

  const deleteAnalysis = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('fea_analyses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting FEA analysis:', error);
        toast.error('Failed to delete FEA analysis');
        return false;
      }

      toast.success('FEA analysis deleted successfully');
      await fetchAnalyses();
      return true;
    } catch (error) {
      console.error('Error deleting FEA analysis:', error);
      toast.error('Failed to delete FEA analysis');
      return false;
    }
  }, [fetchAnalyses]);

  return {
    analyses,
    loading,
    fetchAnalyses,
    createAnalysis,
    deleteAnalysis,
  };
};
