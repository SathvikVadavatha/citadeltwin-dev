
import { useEffect } from 'react';
import { useFEAAnalysisCore } from './fea/useFEAAnalysisCore';
import { useFEALoads } from './fea/useFEALoads';
import { useFEABoundaryConditions } from './fea/useFEABoundaryConditions';
import { useFEAResults } from './fea/useFEAResults';
import { useFEAExecution } from './fea/useFEAExecution';
import { useAuth } from '@/providers/AuthProvider';

export interface CreateAnalysisData {
  upload_id?: string;
  element_id?: string;
  name: string;
  description?: string;
  analysis_type: any;
  input_parameters?: any;
}

export interface CreateLoadData {
  analysis_id: string;
  load_type: any;
  name: string;
  magnitude: number;
  direction: { x: number; y: number; z: number };
  location: { x: number; y: number; z: number };
  properties?: any;
}

export interface CreateBoundaryConditionData {
  analysis_id: string;
  condition_type: any;
  name: string;
  location: any;
  constraints: { x: boolean; y: boolean; z: boolean; rx: boolean; ry: boolean; rz: boolean };
  properties?: any;
}

export const useFEAAnalyses = (elementId?: string) => {
  const { user } = useAuth();
  
  const analysisHooks = useFEAAnalysisCore(elementId);
  const loadHooks = useFEALoads();
  const bcHooks = useFEABoundaryConditions();
  const resultHooks = useFEAResults();
  const executionHooks = useFEAExecution();

  const fetchAnalysisData = async (analysisId: string) => {
    await Promise.all([
      loadHooks.fetchLoads(analysisId),
      bcHooks.fetchBoundaryConditions(analysisId),
      resultHooks.fetchResults(analysisId),
    ]);
  };

  useEffect(() => {
    if (user) {
      analysisHooks.fetchAnalyses();
    }
  }, [user, elementId]);

  return {
    // Analysis core
    analyses: analysisHooks.analyses,
    loading: analysisHooks.loading,
    createAnalysis: analysisHooks.createAnalysis,
    deleteAnalysis: analysisHooks.deleteAnalysis,
    refreshAnalyses: analysisHooks.fetchAnalyses,
    
    // Loads
    loads: loadHooks.loads,
    createLoad: loadHooks.createLoad,
    
    // Boundary conditions
    boundaryConditions: bcHooks.boundaryConditions,
    createBoundaryCondition: bcHooks.createBoundaryCondition,
    
    // Results
    results: resultHooks.results,
    
    // Execution
    running: executionHooks.running,
    runAnalysis: executionHooks.runAnalysis,
    
    // Combined operations
    fetchAnalysisData,
  };
};
