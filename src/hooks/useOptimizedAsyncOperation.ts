
import { useState, useCallback, useRef, useMemo } from 'react';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';

interface AsyncOperationState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

interface UseOptimizedAsyncOperationOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  errorContext?: string;
}

export const useOptimizedAsyncOperation = <T = any>(options: UseOptimizedAsyncOperationOptions = {}) => {
  const {
    showSuccessToast = false,
    successMessage = 'Operation completed successfully',
    showErrorToast = true,
    errorContext = 'Operation'
  } = options;

  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
    data: null
  });

  // Use ref to store options to prevent unnecessary re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Memoize success handler
  const handleSuccess = useCallback((result: T) => {
    setState(prev => ({ ...prev, isLoading: false, data: result, error: null }));
    
    if (optionsRef.current.showSuccessToast) {
      toast.success(optionsRef.current.successMessage || 'Operation completed successfully');
    }
    
    return result;
  }, []);

  // Memoize error handler
  const handleError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    
    if (optionsRef.current.showErrorToast) {
      ErrorHandler.handle(error, optionsRef.current.errorContext || 'Operation');
    }
    
    return null;
  }, []);

  // Memoize execute function
  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await operation();
      return handleSuccess(result);
    } catch (error) {
      return handleError(error);
    }
  }, [handleSuccess, handleError]);

  // Memoize reset function
  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  // Memoize return object
  return useMemo(() => ({
    ...state,
    execute,
    reset
  }), [state, execute, reset]);
};
