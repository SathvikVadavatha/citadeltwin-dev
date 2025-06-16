
import { useCallback } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { toast } from 'sonner';

interface ComplianceRealtimeHooks {
  refreshViolations: () => void;
  refreshChecks: () => void;
}

export const useComplianceRealtime = ({ refreshViolations, refreshChecks }: ComplianceRealtimeHooks) => {
  const handleViolationInsert = useCallback((payload: any) => {
    toast.info('New compliance violation detected');
    refreshViolations();
  }, [refreshViolations]);

  const handleViolationUpdate = useCallback((payload: any) => {
    const violation = payload.new;
    if (violation.status === 'resolved') {
      toast.success('Compliance violation resolved');
    }
    refreshViolations();
  }, [refreshViolations]);

  const handleCheckUpdate = useCallback((payload: any) => {
    const check = payload.new;
    if (check.status === 'completed') {
      toast.success('Compliance check completed');
      refreshChecks();
    } else if (check.status === 'failed') {
      toast.error('Compliance check failed');
      refreshChecks();
    }
  }, [refreshChecks]);

  useRealtimeUpdates([
    {
      table: 'compliance_violations',
      onInsert: handleViolationInsert,
      onUpdate: handleViolationUpdate,
    },
    {
      table: 'compliance_checks',
      onUpdate: handleCheckUpdate,
    }
  ]);
};
