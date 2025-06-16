
import { useCallback, useMemo } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { PerformanceOptimizer } from '@/utils/performance/performanceOptimizer';

export const useOptimizedCollaboration = (projectId?: string) => {
  const collaboration = useCollaboration(projectId);

  // Debounced cursor position updates
  const updateCursorPosition = useMemo(() => 
    PerformanceOptimizer.debounceCollaboration(
      'cursor-position',
      collaboration.updateCursorPosition,
      50 // 50ms debounce for cursor updates
    ), [collaboration.updateCursorPosition]
  );

  // Debounced operation application
  const applyOperation = useMemo(() =>
    PerformanceOptimizer.debounceCollaboration(
      'apply-operation',
      collaboration.applyOperation,
      100 // 100ms debounce for operations
    ), [collaboration.applyOperation]
  );

  // Batch multiple operations
  const applyBatchOperations = useCallback(async (operations: any[]) => {
    return PerformanceOptimizer.batchOperations(
      operations.map(op => () => collaboration.applyOperation(op)),
      3 // Process 3 operations at a time
    );
  }, [collaboration.applyOperation]);

  return {
    ...collaboration,
    updateCursorPosition,
    applyOperation,
    applyBatchOperations,
  };
};
