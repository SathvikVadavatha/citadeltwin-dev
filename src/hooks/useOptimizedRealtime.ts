
import { useCallback, useMemo, useRef, useEffect } from 'react';
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

  // Use refs to maintain stable references for callbacks
  const hooksRef = useRef(hooks);
  hooksRef.current = hooks;

  // Stable event handlers
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
    hooksRef.current.refreshExports?.();
  }, []);

  const handleAnalysisUpdate = useCallback((payload: any) => {
    const analysis = payload.new;
    switch (analysis.status) {
      case 'running':
        toast.info('FEA analysis started');
        break;
      case 'completed':
        toast.success('FEA analysis completed');
        hooksRef.current.refreshResults?.();
        break;
      case 'failed':
        toast.error('FEA analysis failed');
        break;
    }
    hooksRef.current.refreshAnalyses?.();
  }, []);

  const handleResultInsert = useCallback((payload: any) => {
    toast.success('New FEA results available');
    hooksRef.current.refreshResults?.();
  }, []);

  const handleViolationInsert = useCallback((payload: any) => {
    toast.info('New compliance violation detected');
    hooksRef.current.refreshViolations?.();
  }, []);

  const handleViolationUpdate = useCallback((payload: any) => {
    const violation = payload.new;
    if (violation.status === 'resolved') {
      toast.success('Compliance violation resolved');
    }
    hooksRef.current.refreshViolations?.();
  }, []);

  const handleCheckUpdate = useCallback((payload: any) => {
    const check = payload.new;
    if (check.status === 'completed') {
      toast.success('Compliance check completed');
      hooksRef.current.refreshChecks?.();
    } else if (check.status === 'failed') {
      toast.error('Compliance check failed');
      hooksRef.current.refreshChecks?.();
    }
  }, []);

  // Memoize subscriptions configuration
  const subscriptions = useMemo(() => {
    const configs = [];

    if (refreshExports) {
      configs.push({
        id: `document_exports_${projectId || 'global'}`,
        table: 'document_exports',
        filter: projectId ? `project_id=eq.${projectId}` : undefined,
        onUpdate: handleExportUpdate,
      });
    }

    if (refreshAnalyses || refreshResults) {
      configs.push({
        id: `fea_analyses_${projectId || 'global'}`,
        table: 'fea_analyses',
        filter: projectId ? `project_id=eq.${projectId}` : undefined,
        onUpdate: handleAnalysisUpdate,
      });
    }

    if (refreshResults) {
      configs.push({
        id: `fea_results_${projectId || 'global'}`,
        table: 'fea_results',
        onInsert: handleResultInsert,
      });
    }

    if (refreshViolations) {
      configs.push({
        id: `compliance_violations_${projectId || 'global'}`,
        table: 'compliance_violations',
        filter: projectId ? `project_id=eq.${projectId}` : undefined,
        onInsert: handleViolationInsert,
        onUpdate: handleViolationUpdate,
      });
    }

    if (refreshChecks) {
      configs.push({
        id: `compliance_checks_${projectId || 'global'}`,
        table: 'compliance_checks',
        filter: projectId ? `project_id=eq.${projectId}` : undefined,
        onUpdate: handleCheckUpdate,
      });
    }

    return configs;
  }, [
    projectId,
    !!refreshExports,
    !!refreshAnalyses,
    !!refreshResults,
    !!refreshViolations,
    !!refreshChecks,
    handleExportUpdate,
    handleAnalysisUpdate,
    handleResultInsert,
    handleViolationInsert,
    handleViolationUpdate,
    handleCheckUpdate,
  ]);

  const { activeSubscriptions, cleanup } = useRealtimeManager(subscriptions);

  // Provide cleanup function to consumers
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    activeSubscriptions,
    cleanup,
  };
};
