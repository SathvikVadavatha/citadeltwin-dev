
import { useState, useCallback } from 'react';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';

interface AsyncOperationState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

interface UseAsyncOperationOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  errorContext?: string;
}

export const useAsyncOperation = <T = any>(options: UseAsyncOperationOptions = {}) => {
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

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await operation();
      setState(prev => ({ ...prev, isLoading: false, data: result, error: null }));
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      
      if (showErrorToast) {
        ErrorHandler.handle(error, errorContext);
      }
      
      return null;
    }
  }, [showSuccessToast, successMessage, showErrorToast, errorContext]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};
