
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useFEAExecution = () => {
  const [running, setRunning] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const runAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      console.log('Starting FEA analysis execution:', analysisId);
      
      const { data, error } = await supabase.functions.invoke('real-fea-integration', {
        body: {
          action: 'run_analysis',
          analysisId,
          solverSettings: {
            solver: 'calculix',
            precision: 'double',
            maxIterations: 1000,
            convergenceTolerance: 1e-6
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('FEA analysis completed successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['fea-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['fea-results'] });
      toast.success('FEA analysis completed successfully');
      setRunning(false);
    },
    onError: (error: any) => {
      console.error('FEA analysis execution error:', error);
      toast.error(`FEA analysis failed: ${error.message}`);
      setRunning(false);
    },
  });

  const runAnalysis = useCallback(async (analysisId: string) => {
    if (!user) {
      toast.error('Please sign in to run FEA analysis');
      return;
    }

    setRunning(true);
    try {
      await runAnalysisMutation.mutateAsync(analysisId);
    } catch (error) {
      console.error('Error running FEA analysis:', error);
    }
  }, [user, runAnalysisMutation]);

  return {
    running,
    runAnalysis,
    isExecuting: runAnalysisMutation.isPending,
  };
};
