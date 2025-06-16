
import { useCallback, useMemo } from 'react';
import { useRealtimeManager } from './useRealtimeManager';
import { toast } from 'sonner';

interface OptimizedRealtimeHooks {
  refreshExports?: () => void;
  refreshAnalyses?: () => void;
  refreshResults?: () => void;
  refreshViolations?: () => void;
  refreshChecks?: () => void;
}

export const useOptimizedRealtime = (projectId?: string, hooks: OptimizedRealtimeHooks = {}) => {
  const {
    refreshExports,
    refreshAnalyses,
    refreshResults,
    refreshViolations,
    refreshChecks,
  } = hooks;

  // Document export handlers
  const handleExportUpdate = useCallback((payload: any) => {
    const exportDoc = payload.new;
    switch (exportDoc.status) {
      case 'generating':
        toast.info('Document generation started');
        break;
      case 'completed':
        toast.success('Document generated successfully');
        break;
      case 'failed':
        toast.error('Document generation failed');
        break;
    }
    refreshExports?.();
  }, [refreshExports]);

  // FEA analysis handlers
  const handleAnalysisUpdate = useCallback((payload: any) => {
    const analysis = payload.new;
    switch (analysis.status) {
      case 'running':
        toast.info('FEA analysis started');
        break;
      case 'completed':
        toast.success('FEA analysis completed');
        refreshResults?.();
        break;
      case 'failed':
        toast.error('FEA analysis failed');
        break;
    }
    refreshAnalyses?.();
  }, [refreshAnalyses, refreshResults]);

  const handleResultInsert = useCallback((payload: any) => {
    toast.success('New FEA results available');
    refreshResults?.();
  }, [refreshResults]);

  // Compliance handlers
  const handleViolationInsert = useCallback((payload: any) => {
    toast.info('New compliance violation detected');
    refreshViolations?.();
  }, [refreshViolations]);

  const handleViolationUpdate = useCallback((payload: any) => {
    const violation = payload.new;
    if (violation.status === 'resolved') {
      toast.success('Compliance violation resolved');
    }
    refreshViolations?.();
  }, [refreshViolations]);

  const handleCheckUpdate = useCallback((payload: any) => {
    const check = payload.new;
    if (check.status === 'completed') {
      toast.success('Compliance check completed');
      refreshChecks?.();
    } else if (check.status === 'failed') {
      toast.error('Compliance check failed');
      refreshChecks?.();
    }
  }, [refreshChecks]);

  // Consolidated subscriptions configuration
  const subscriptions = useMemo(() => {
    const configs = [];

    if (refreshExports) {
      configs.push({
        id: 'document_exports',
        table: 'document_exports',
        filter: projectId ? `project_id=eq.${projectId}` : undefined,
        onUpdate: handleExportUpdate,
      });
    }

    if (refreshAnalyses || refreshResults) {
      configs.push({
        id: 'fea_analyses',
        table: 'fea_analyses',
        filter: projectId ? `project_id=eq.${projectId}` : undefined,
        onUpdate: handleAnalysisUpdate,
      });
    }

    if (refreshResults) {
      configs.push({
        id: 'fea_results',
        table: 'fea_results',
        onInsert: handleResultInsert,
      });
    }

    if (refreshViolations) {
      configs.push(
        {
          id: 'compliance_violations',
          table: 'compliance_violations',
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
          onInsert: handleViolationInsert,
          onUpdate: handleViolationUpdate,
        }
      );
    }

    if (refreshChecks) {
      configs.push({
        id: 'compliance_checks',
        table: 'compliance_checks',
        filter: projectId ? `project_id=eq.${projectId}` : undefined,
        onUpdate: handleCheckUpdate,
      });
    }

    return configs;
  }, [
    projectId,
    refreshExports,
    refreshAnalyses,
    refreshResults,
    refreshViolations,
    refreshChecks,
    handleExportUpdate,
    handleAnalysisUpdate,
    handleResultInsert,
    handleViolationInsert,
    handleViolationUpdate,
    handleCheckUpdate,
  ]);

  const { activeSubscriptions, cleanup } = useRealtimeManager(subscriptions);

  return {
    activeSubscriptions,
    cleanup,
  };
};
