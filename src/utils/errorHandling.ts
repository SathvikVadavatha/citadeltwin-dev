
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface ErrorInfo {
  message: string;
  stack?: string;
  context?: string;
  timestamp: Date;
  userId?: string;
}

export class ErrorHandler {
  static handle(error: unknown, context: string = 'Unknown'): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: this.getErrorMessage(error),
      context,
      timestamp: new Date(),
    };

    if (error instanceof Error) {
      errorInfo.stack = error.stack;
    }

    // Log the error
    logger.error(`Error in ${context}:`, errorInfo);

    return errorInfo;
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  }
}

export const useErrorHandler = () => {
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context: string = 'Operation'
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error, context);
      toast.error(`${context} failed: ${errorInfo.message}`);
      return null;
    }
  };

  return { withErrorHandling };
};
