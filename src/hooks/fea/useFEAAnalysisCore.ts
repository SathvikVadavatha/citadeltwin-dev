
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface FEAAnalysis {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  analysis_type: 'static' | 'modal' | 'buckling' | 'dynamic' | 'thermal';
  status: 'pending' | 'running' | 'completed' | 'failed';
  element_id?: string;
  upload_id?: string;
  input_parameters: any;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useFEAAnalysisCore = (elementId?: string) => {
  const [analyses, setAnalyses] = useState<FEAAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchAnalyses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let query = supabase
        .from('fea_analyses')
        .select('*')
        .eq('user_id', user.id)
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

      setAnalyses((data || []) as FEAAnalysis[]);
    } catch (error) {
      console.error('Error fetching FEA analyses:', error);
      toast.error('Failed to load FEA analyses');
    } finally {
      setLoading(false);
    }
  };

  const createAnalysisMutation = useMutation({
    mutationFn: async (analysisData: {
      upload_id?: string;
      element_id?: string;
      name: string;
      description?: string;
      analysis_type: 'static' | 'modal' | 'buckling' | 'dynamic' | 'thermal';
      input_parameters?: any;
    }) => {
      const { data, error } = await supabase
        .from('fea_analyses')
        .insert({
          ...analysisData,
          user_id: user!.id,
          status: 'pending',
          input_parameters: analysisData.input_parameters || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data as FEAAnalysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fea-analyses'] });
      toast.success('FEA analysis created successfully');
      fetchAnalyses();
    },
    onError: (error: any) => {
      console.error('Error creating FEA analysis:', error);
      toast.error('Failed to create FEA analysis');
    },
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from('fea_analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fea-analyses'] });
      toast.success('FEA analysis deleted successfully');
      fetchAnalyses();
    },
    onError: (error: any) => {
      console.error('Error deleting FEA analysis:', error);
      toast.error('Failed to delete FEA analysis');
    },
  });

  const createAnalysis = async (analysisData: Parameters<typeof createAnalysisMutation.mutateAsync>[0]) => {
    if (!user) {
      toast.error('Please sign in to create FEA analysis');
      return null;
    }

    try {
      return await createAnalysisMutation.mutateAsync(analysisData);
    } catch (error) {
      console.error('Error creating FEA analysis:', error);
      return null;
    }
  };

  const deleteAnalysis = async (analysisId: string) => {
    if (!user) {
      toast.error('Please sign in to delete FEA analysis');
      return false;
    }

    try {
      await deleteAnalysisMutation.mutateAsync(analysisId);
      return true;
    } catch (error) {
      console.error('Error deleting FEA analysis:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [user, elementId]);

  return {
    analyses,
    loading,
    createAnalysis,
    deleteAnalysis,
    fetchAnalyses,
    isCreating: createAnalysisMutation.isPending,
    isDeleting: deleteAnalysisMutation.isPending,
  };
};
