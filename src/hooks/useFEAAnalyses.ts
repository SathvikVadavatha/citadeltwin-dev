
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { useFEAAnalysisCore } from './fea/useFEAAnalysisCore';
import { useFEALoads } from './fea/useFEALoads';
import { useFEABoundaryConditions } from './fea/useFEABoundaryConditions';
import { useFEAResults } from './fea/useFEAResults';
import { useFEAExecution } from './fea/useFEAExecution';

// Unified FEA hook that combines all FEA functionality
export const useFEAAnalyses = (elementId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Core analysis operations
  const {
    analyses,
    loading: analysesLoading,
    createAnalysis,
    deleteAnalysis,
    fetchAnalyses,
    isCreating: isCreatingAnalysis,
    isDeleting: isDeletingAnalysis,
  } = useFEAAnalysisCore(elementId);

  // Load management
  const {
    loads,
    fetchLoads,
    createLoad,
    isCreating: isCreatingLoad,
  } = useFEALoads();

  // Boundary conditions management
  const {
    boundaryConditions,
    fetchBoundaryConditions,
    createBoundaryCondition,
    isCreating: isCreatingBoundaryCondition,
  } = useFEABoundaryConditions();

  // Results management
  const {
    results,
    fetchResults,
  } = useFEAResults();

  // Execution management
  const {
    running,
    runAnalysis,
    isExecuting,
  } = useFEAExecution();

  // Workflow validation function
  const validateAnalysisWorkflow = async (analysisId: string) => {
    try {
      // Fetch analysis details
      const analysis = analyses.find(a => a.id === analysisId);
      if (!analysis) {
        throw new Error('Analysis not found');
      }

      // Validate loads exist
      await fetchLoads(analysisId);
      if (loads.length === 0) {
        throw new Error('No loads defined for analysis');
      }

      // Validate boundary conditions exist
      await fetchBoundaryConditions(analysisId);
      if (boundaryConditions.length === 0) {
        throw new Error('No boundary conditions defined for analysis');
      }

      return { valid: true, message: 'Analysis workflow validated successfully' };
    } catch (error: any) {
      return { valid: false, message: error.message };
    }
  };

  // Comprehensive analysis setup
  const setupCompleteAnalysis = async (params: {
    name: string;
    analysisType: 'static' | 'modal' | 'buckling' | 'dynamic' | 'thermal';
    elementId?: string;
    loads: Array<{
      name: string;
      load_type: 'point_load' | 'distributed_load' | 'moment' | 'pressure' | 'temperature' | 'gravity';
      magnitude: number;
      direction: { x: number; y: number; z: number };
      location: { x: number; y: number; z: number };
      properties?: any;
    }>;
    boundaryConditions: Array<{
      name: string;
      condition_type: 'fixed' | 'pinned' | 'roller' | 'free' | 'symmetry';
      location: any;
      constraints: { x: boolean; y: boolean; z: boolean; rx: boolean; ry: boolean; rz: boolean };
      properties?: any;
    }>;
  }) => {
    try {
      // Create analysis
      const analysis = await createAnalysis({
        name: params.name,
        analysis_type: params.analysisType,
        element_id: params.elementId,
        input_parameters: {
          setupMethod: 'complete',
          timestamp: new Date().toISOString()
        }
      });

      if (!analysis) {
        throw new Error('Failed to create analysis');
      }

      // Add loads
      for (const load of params.loads) {
        await createLoad({
          analysis_id: analysis.id,
          ...load
        });
      }

      // Add boundary conditions
      for (const bc of params.boundaryConditions) {
        await createBoundaryCondition({
          analysis_id: analysis.id,
          ...bc
        });
      }

      // Validate workflow
      const validation = await validateAnalysisWorkflow(analysis.id);
      if (!validation.valid) {
        throw new Error(`Workflow validation failed: ${validation.message}`);
      }

      toast.success('Complete FEA analysis setup successfully');
      return analysis;
    } catch (error: any) {
      console.error('Error setting up complete analysis:', error);
      toast.error(`Failed to setup analysis: ${error.message}`);
      return null;
    }
  };

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lastFetchTime: 0,
    analysisCount: 0,
    averageSetupTime: 0
  });

  useEffect(() => {
    const startTime = Date.now();
    fetchAnalyses().then(() => {
      const fetchTime = Date.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        lastFetchTime: fetchTime,
        analysisCount: analyses.length
      }));
    });
  }, []);

  return {
    // Core data
    analyses,
    loads,
    boundaryConditions,
    results,
    
    // Loading states
    analysesLoading,
    isCreatingAnalysis,
    isDeletingAnalysis,
    isCreatingLoad,
    isCreatingBoundaryCondition,
    isExecuting,
    running,
    
    // Core operations
    createAnalysis,
    deleteAnalysis,
    createLoad,
    createBoundaryCondition,
    runAnalysis,
    
    // Fetch operations
    fetchAnalyses,
    fetchLoads,
    fetchBoundaryConditions,
    fetchResults,
    
    // Validation & workflow
    validateAnalysisWorkflow,
    setupCompleteAnalysis,
    
    // Performance metrics
    performanceMetrics,
  };
};
