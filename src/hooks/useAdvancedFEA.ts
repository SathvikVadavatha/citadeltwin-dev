
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface AdvancedFEAParams {
  analysisId: string;
  analysisType: 'static' | 'modal' | 'buckling' | 'dynamic' | 'thermal' | 'nonlinear';
  materialModel?: 'linear' | 'nonlinear' | 'composite' | 'thermal';
  complexLoading?: {
    timeVarying: boolean;
    loadFunctions: any[];
    dynamicProperties?: any;
  };
  solverSettings?: {
    convergenceTolerance: number;
    maxIterations: number;
    timeIntegration?: string;
  };
}

export const useAdvancedFEA = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [runningAnalyses, setRunningAnalyses] = useState<any[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState<{ [key: string]: number }>({});

  // Query for advanced FEA analyses
  const { data: analyses = [] } = useQuery({
    queryKey: ['advanced-fea-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Advanced dynamic analysis
  const runDynamicAnalysisMutation = useMutation({
    mutationFn: async (params: AdvancedFEAParams) => {
      const { data, error } = await supabase.functions.invoke('advanced-fea-integration', {
        body: {
          action: 'run_dynamic_analysis',
          ...params,
          timeIntegration: {
            method: 'newmark',
            beta: 0.25,
            gamma: 0.5,
            timeStep: 0.01,
            totalTime: 10.0
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-fea-analyses'] });
      toast.success('Dynamic analysis completed successfully');
    },
    onError: (error: any) => {
      console.error('Dynamic analysis error:', error);
      toast.error(`Dynamic analysis failed: ${error.message}`);
    },
  });

  // Nonlinear analysis
  const runNonlinearAnalysisMutation = useMutation({
    mutationFn: async (params: AdvancedFEAParams) => {
      const { data, error } = await supabase.functions.invoke('advanced-fea-integration', {
        body: {
          action: 'run_nonlinear_analysis',
          ...params,
          nonlinearSettings: {
            maxIterations: 100,
            convergenceTolerance: 1e-6,
            loadSteps: 10,
            adaptiveLoadStepping: true
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-fea-analyses'] });
      toast.success('Nonlinear analysis completed successfully');
    },
    onError: (error: any) => {
      console.error('Nonlinear analysis error:', error);
      toast.error(`Nonlinear analysis failed: ${error.message}`);
    },
  });

  // Thermal-structural coupling
  const runThermalStructuralMutation = useMutation({
    mutationFn: async (params: AdvancedFEAParams) => {
      const { data, error } = await supabase.functions.invoke('advanced-fea-integration', {
        body: {
          action: 'run_thermal_structural',
          ...params,
          coupling: {
            thermalLoads: true,
            temperatureDependentMaterials: true,
            thermalExpansion: true
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-fea-analyses'] });
      toast.success('Thermal-structural analysis completed successfully');
    },
    onError: (error: any) => {
      console.error('Thermal-structural analysis error:', error);
      toast.error(`Thermal-structural analysis failed: ${error.message}`);
    },
  });

  // Advanced results processing
  const processAdvancedResultsMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data, error } = await supabase.functions.invoke('advanced-fea-integration', {
        body: {
          action: 'process_advanced_results',
          analysisId,
          postProcessing: {
            generateContours: true,
            generateVectors: true,
            generateAnimations: true,
            extractCriticalValues: true,
            calculateSafetyFactors: true
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fea-results'] });
      toast.success('Results processing completed');
    },
  });

  // Analysis control functions
  const startAnalysis = useCallback(async (analysisId: string, type: string) => {
    setRunningAnalyses(prev => [...prev, { id: analysisId, type, startTime: Date.now() }]);
    setAnalysisProgress(prev => ({ ...prev, [analysisId]: 0 }));
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        const currentProgress = prev[analysisId] || 0;
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, [analysisId]: currentProgress + Math.random() * 10 };
      });
    }, 1000);
  }, []);

  const pauseAnalysis = useCallback(async (analysisId: string) => {
    // Implementation for pausing analysis
    toast.info('Analysis paused');
  }, []);

  const stopAnalysis = useCallback(async (analysisId: string) => {
    setRunningAnalyses(prev => prev.filter(a => a.id !== analysisId));
    setAnalysisProgress(prev => {
      const { [analysisId]: removed, ...rest } = prev;
      return rest;
    });
    toast.info('Analysis stopped');
  }, []);

  const getAnalysisProgress = useCallback((analysisId: string) => {
    return Math.round(analysisProgress[analysisId] || 0);
  }, [analysisProgress]);

  return {
    analyses,
    runningAnalyses,
    analysisProgress,
    
    // Analysis execution
    runDynamicAnalysis: runDynamicAnalysisMutation.mutateAsync,
    runNonlinearAnalysis: runNonlinearAnalysisMutation.mutateAsync,
    runThermalStructural: runThermalStructuralMutation.mutateAsync,
    processAdvancedResults: processAdvancedResultsMutation.mutateAsync,
    
    // Analysis control
    startAnalysis,
    pauseAnalysis,
    stopAnalysis,
    getAnalysisProgress,
    
    // Status
    isRunningAnalysis: runDynamicAnalysisMutation.isPending || 
                      runNonlinearAnalysisMutation.isPending || 
                      runThermalStructuralMutation.isPending,
    isProcessingResults: processAdvancedResultsMutation.isPending,
  };
};
