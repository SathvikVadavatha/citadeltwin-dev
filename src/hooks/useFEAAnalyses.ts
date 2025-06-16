
import { useState, useCallback } from 'react';
import { useFEAAnalysisCore } from '@/hooks/fea/useFEAAnalysisCore';
import { useFEALoads } from '@/hooks/fea/useFEALoads';
import { useFEABoundaryConditions } from '@/hooks/fea/useFEABoundaryConditions';
import { useFEAExecution } from '@/hooks/fea/useFEAExecution';
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions';

export const useFEAAnalyses = (elementId?: string) => {
  const { 
    analyses, 
    loading, 
    fetchAnalyses, 
    createAnalysis, 
    deleteAnalysis 
  } = useFEAAnalysisCore(elementId);
  
  const { createLoad } = useFEALoads();
  const { createBoundaryCondition } = useFEABoundaryConditions();
  const { runAnalysis: executeAnalysis } = useFEAExecution();
  const { executeFEAAnalysis } = useEdgeFunctions();

  const runAnalysis = useCallback(async (analysisId: string): Promise<boolean> => {
    try {
      // Use the edge function for comprehensive analysis execution
      await executeFEAAnalysis(analysisId);
      await fetchAnalyses();
      return true;
    } catch (error) {
      console.error('Error running FEA analysis:', error);
      return false;
    }
  }, [executeFEAAnalysis, fetchAnalyses]);

  return {
    analyses,
    loading,
    fetchAnalyses,
    createAnalysis,
    deleteAnalysis,
    createLoad,
    createBoundaryCondition,
    runAnalysis,
  };
};
