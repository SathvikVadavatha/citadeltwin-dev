
import { useState, useCallback } from 'react';
import { useFEAAnalysisCore, CreateAnalysisData } from '@/hooks/fea/useFEAAnalysisCore';
import { useFEALoads, CreateLoadData } from '@/hooks/fea/useFEALoads';
import { useFEABoundaryConditions, CreateBoundaryConditionData } from '@/hooks/fea/useFEABoundaryConditions';
import { useFEAExecution } from '@/hooks/fea/useFEAExecution';
import { useFEAResults } from '@/hooks/fea/useFEAResults';
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions';

// Re-export types for components
export type { CreateAnalysisData, CreateLoadData, CreateBoundaryConditionData };

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
  const { results, fetchResults } = useFEAResults();
  const { executeFEAAnalysis } = useEdgeFunctions();

  const runAnalysis = useCallback(async (analysisId: string): Promise<boolean> => {
    try {
      // Use the edge function for comprehensive analysis execution
      await executeFEAAnalysis(analysisId);
      await fetchAnalyses();
      await fetchResults(analysisId);
      return true;
    } catch (error) {
      console.error('Error running FEA analysis:', error);
      return false;
    }
  }, [executeFEAAnalysis, fetchAnalyses, fetchResults]);

  return {
    analyses,
    loading,
    results,
    fetchAnalyses,
    createAnalysis,
    deleteAnalysis,
    createLoad,
    createBoundaryCondition,
    runAnalysis,
  };
};
