
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface FEAAnalysisParams {
  analysisId: string;
  elementId?: string;
  analysisType: 'static' | 'modal' | 'buckling';
  forces?: any[];
  constraints?: any[];
  materialProperties?: any;
  numberOfModes?: number;
  loads?: any[];
}

export const useRealFEA = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const runStaticAnalysisMutation = useMutation({
    mutationFn: async (params: FEAAnalysisParams) => {
      const { data, error } = await supabase.functions.invoke('real-fea-integration', {
        body: {
          action: 'run_static_analysis',
          ...params
        }
      });

      if (error) {
        console.error('Error running static analysis:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fea-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['fea-results'] });
      toast.success('Static analysis completed successfully');
    },
    onError: (error: any) => {
      console.error('Static analysis error:', error);
      toast.error(`Static analysis failed: ${error.message}`);
    },
  });

  const runModalAnalysisMutation = useMutation({
    mutationFn: async (params: FEAAnalysisParams) => {
      const { data, error } = await supabase.functions.invoke('real-fea-integration', {
        body: {
          action: 'run_modal_analysis',
          ...params
        }
      });

      if (error) {
        console.error('Error running modal analysis:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fea-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['fea-results'] });
      toast.success('Modal analysis completed successfully');
    },
    onError: (error: any) => {
      console.error('Modal analysis error:', error);
      toast.error(`Modal analysis failed: ${error.message}`);
    },
  });

  const runBucklingAnalysisMutation = useMutation({
    mutationFn: async (params: FEAAnalysisParams) => {
      const { data, error } = await supabase.functions.invoke('real-fea-integration', {
        body: {
          action: 'run_buckling_analysis',
          ...params
        }
      });

      if (error) {
        console.error('Error running buckling analysis:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fea-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['fea-results'] });
      toast.success('Buckling analysis completed successfully');
    },
    onError: (error: any) => {
      console.error('Buckling analysis error:', error);
      toast.error(`Buckling analysis failed: ${error.message}`);
    },
  });

  const generateMeshMutation = useMutation({
    mutationFn: async ({
      analysisId,
      elementId,
      meshSize = 0.1,
      elementType = 'C3D20'
    }: {
      analysisId: string;
      elementId: string;
      meshSize?: number;
      elementType?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('real-fea-integration', {
        body: {
          action: 'generate_mesh',
          analysisId,
          elementId,
          meshSize,
          elementType
        }
      });

      if (error) {
        console.error('Error generating mesh:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fea-meshes'] });
      toast.success('Mesh generated successfully');
    },
    onError: (error: any) => {
      console.error('Mesh generation error:', error);
      toast.error(`Mesh generation failed: ${error.message}`);
    },
  });

  const validateModelMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data, error } = await supabase.functions.invoke('real-fea-integration', {
        body: {
          action: 'validate_model',
          analysisId
        }
      });

      if (error) {
        console.error('Error validating model:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.validation.isValid) {
        toast.success('Model validation passed');
      } else {
        toast.warning('Model validation found issues - check the results');
      }
    },
    onError: (error: any) => {
      console.error('Model validation error:', error);
      toast.error(`Model validation failed: ${error.message}`);
    },
  });

  const { data: analysisStatus } = useQuery({
    queryKey: ['analysis-status'],
    queryFn: async () => {
      // This would track running analyses
      const { data, error } = await supabase
        .from('fea_analyses')
        .select('id, status, started_at, completed_at')
        .eq('status', 'running')
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 2000, // Poll every 2 seconds for running analyses
    enabled: !!user,
  });

  const getAnalysisStatus = async (analysisId: string) => {
    const { data, error } = await supabase.functions.invoke('real-fea-integration', {
      body: {
        action: 'get_analysis_status',
        analysisId
      }
    });

    if (error) throw error;
    return data;
  };

  return {
    runStaticAnalysis: runStaticAnalysisMutation.mutateAsync,
    runModalAnalysis: runModalAnalysisMutation.mutateAsync,
    runBucklingAnalysis: runBucklingAnalysisMutation.mutateAsync,
    generateMesh: generateMeshMutation.mutateAsync,
    validateModel: validateModelMutation.mutateAsync,
    getAnalysisStatus,
    analysisStatus: analysisStatus || [],
    isRunningAnalysis: runStaticAnalysisMutation.isPending || 
                      runModalAnalysisMutation.isPending || 
                      runBucklingAnalysisMutation.isPending,
    isGeneratingMesh: generateMeshMutation.isPending,
    isValidating: validateModelMutation.isPending,
  };
};
