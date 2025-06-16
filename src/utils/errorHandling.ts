
import { toast } from 'sonner';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandler {
  static handle(error: unknown, context?: string): AppError {
    const appError: AppError = {
      message: 'An unexpected error occurred',
      timestamp: new Date(),
    };

    if (error instanceof Error) {
      appError.message = error.message;
      appError.details = error.stack;
    } else if (typeof error === 'string') {
      appError.message = error;
    } else if (error && typeof error === 'object') {
      appError.message = (error as any).message || 'Unknown error';
      appError.code = (error as any).code;
      appError.details = error;
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorHandler${context ? ` - ${context}` : ''}]:`, error);
    }

    return appError;
  }

  static showToast(error: unknown, context?: string) {
    const appError = this.handle(error, context);
    toast.error(appError.message);
    return appError;
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string,
    showToast = true
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      if (showToast) {
        this.showToast(error, context);
      } else {
        this.handle(error, context);
      }
      return null;
    }
  }
}

// Utility hook for error handling
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: string, showToast = true) => {
    return ErrorHandler.handle(error, context);
  };

  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context?: string,
    showToast = true
  ): Promise<T | null> => {
    return ErrorHandler.withErrorHandling(operation, context, showToast);
  };

  return { handleError, withErrorHandling };
};
