
import { useCallback, useMemo, useRef } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';

export const useSimplifiedCollaboration = (projectId?: string) => {
  const collaboration = useCollaboration(projectId);
  
  // Use refs to store timeout IDs and prevent recreation
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const operationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable debounced cursor update with proper typing
  const debouncedCursorUpdate = useCallback((position: { x: number; y: number }) => {
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
    }
    cursorTimeoutRef.current = setTimeout(() => {
      collaboration.updateCursorPosition(position);
    }, 100);
  }, [collaboration.updateCursorPosition]);

  // Stable debounced operation with proper typing
  const debouncedOperation = useCallback((operation: any) => {
    if (operationTimeoutRef.current) {
      clearTimeout(operationTimeoutRef.current);
    }
    operationTimeoutRef.current = setTimeout(() => {
      collaboration.applyOperation(operation);
    }, 200);
  }, [collaboration.applyOperation]);

  // Simple batch operations
  const applyBatchOperations = useCallback(async (operations: any[]) => {
    for (const operation of operations) {
      await collaboration.applyOperation(operation);
    }
  }, [collaboration.applyOperation]);

  // Cleanup timeouts
  const cleanup = useCallback(() => {
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = null;
    }
    if (operationTimeoutRef.current) {
      clearTimeout(operationTimeoutRef.current);
      operationTimeoutRef.current = null;
    }
  }, []);

  return {
    ...collaboration,
    updateCursorPosition: debouncedCursorUpdate,
    applyOperation: debouncedOperation,
    applyBatchOperations,
    cleanup,
  };
};
