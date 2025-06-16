
import { useCallback } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { toast } from 'sonner';

interface FEARealtimeHooks {
  refreshAnalyses: () => void;
  refreshResults: () => void;
}

export const useFEARealtime = ({ refreshAnalyses, refreshResults }: FEARealtimeHooks) => {
  const handleAnalysisUpdate = useCallback((payload: any) => {
    const analysis = payload.new;
    switch (analysis.status) {
      case 'running':
        toast.info('FEA analysis started');
        break;
      case 'completed':
        toast.success('FEA analysis completed');
        refreshResults();
        break;
      case 'failed':
        toast.error('FEA analysis failed');
        break;
    }
    refreshAnalyses();
  }, [refreshAnalyses, refreshResults]);

  const handleResultInsert = useCallback((payload: any) => {
    toast.success('New FEA results available');
    refreshResults();
  }, [refreshResults]);

  useRealtimeUpdates([
    {
      table: 'fea_analyses',
      onUpdate: handleAnalysisUpdate,
    },
    {
      table: 'fea_results',
      onInsert: handleResultInsert,
    }
  ]);
};
