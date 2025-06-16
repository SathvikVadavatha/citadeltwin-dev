
import { useCallback, useMemo } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';

// Simple debounce without multiple layers
const createSimpleDebounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};

export const useSimplifiedCollaboration = (projectId?: string) => {
  const collaboration = useCollaboration(projectId);

  // Single debounce layer - simplified approach
  const debouncedCursorUpdate = useMemo(() => 
    createSimpleDebounce(collaboration.updateCursorPosition, 100), 
    [collaboration.updateCursorPosition]
  );

  const debouncedOperation = useMemo(() =>
    createSimpleDebounce(collaboration.applyOperation, 200),
    [collaboration.applyOperation]
  );

  // Batch operations without complex optimization
  const applyBatchOperations = useCallback(async (operations: any[]) => {
    for (const operation of operations) {
      await collaboration.applyOperation(operation);
    }
  }, [collaboration.applyOperation]);

  return {
    ...collaboration,
    updateCursorPosition: debouncedCursorUpdate,
    applyOperation: debouncedOperation,
    applyBatchOperations,
  };
};
