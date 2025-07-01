
import { useState, useCallback } from 'react';
import { ProcessingState } from '../types/processingTypes';

export const useProcessingState = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    processing: false,
    generating3D: false,
    processingMethod: null,
    errorMessage: null
  });

  const updateProcessingState = useCallback((updates: Partial<ProcessingState>) => {
    setProcessingState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetProcessingState = useCallback(() => {
    setProcessingState({
      processing: false,
      generating3D: false,
      processingMethod: null,
      errorMessage: null
    });
  }, []);

  return {
    processingState,
    updateProcessingState,
    resetProcessingState
  };
};
