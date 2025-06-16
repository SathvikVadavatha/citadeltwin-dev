
import { useCallback, useMemo, useRef } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';

// Stable debounce implementation that doesn't recreate functions
const useStableDebounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fnRef = useRef(fn);
  
  // Update function reference without causing re-renders
  fnRef.current = fn;

  return useCallback(((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      fnRef.current(...args);
    }, delay);
  }) as T, [delay]);
};

export const useStableCollaboration = (projectId?: string) => {
  const collaboration = useCollaboration(projectId);

  // Stable debounced functions that won't cause infinite re-renders
  const debouncedCursorUpdate = useStableDebounce(
    collaboration.updateCursorPosition, 
    100
  );

  const debouncedOperation = useStableDebounce(
    collaboration.applyOperation, 
    200
  );

  // Batch operations with stable implementation
  const applyBatchOperations = useCallback(async (operations: any[]) => {
    const batchSize = 3;
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      await Promise.all(batch.map(op => collaboration.applyOperation(op)));
    }
  }, [collaboration.applyOperation]);

  return {
    ...collaboration,
    updateCursorPosition: debouncedCursorUpdate,
    applyOperation: debouncedOperation,
    applyBatchOperations,
  };
};
