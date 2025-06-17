
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface ErrorInfo {
  message: string;
  stack?: string;
  context?: string;
  timestamp: Date;
  userId?: string;
  userFriendly?: string;
}

export class ErrorHandler {
  static handle(error: unknown, context: string = 'Unknown'): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: this.getErrorMessage(error),
      context,
      timestamp: new Date(),
      userFriendly: this.getUserFriendlyMessage(error, context),
    };

    if (error instanceof Error) {
      errorInfo.stack = error.stack;
    }

    // Log the error with proper string serialization
    logger.error(`Error in ${context}:`, JSON.stringify(errorInfo));

    // Show user-friendly toast
    toast.error(errorInfo.userFriendly || errorInfo.message);

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

  private static getUserFriendlyMessage(error: unknown, context: string): string {
    const message = this.getErrorMessage(error).toLowerCase();
    
    // Network and API errors
    if (message.includes('fetch') || message.includes('network')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'You don\'t have permission to perform this action. Please contact your administrator.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource could not be found. It may have been moved or deleted.';
    }
    
    if (message.includes('timeout')) {
      return 'The operation took too long to complete. Please try again.';
    }
    
    // Document-specific errors
    if (context.toLowerCase().includes('document')) {
      if (message.includes('template')) {
        return 'There was an issue with the document template. Please try selecting a different template.';
      }
      if (message.includes('generation') || message.includes('generate')) {
        return 'Document generation failed. Please check your inputs and try again.';
      }
      if (message.includes('upload')) {
        return 'File upload failed. Please ensure the file is valid and try again.';
      }
    }
    
    // FEA-specific errors
    if (context.toLowerCase().includes('fea') || context.toLowerCase().includes('analysis')) {
      return 'The structural analysis encountered an error. Please verify your model parameters and try again.';
    }
    
    // Authentication errors
    if (message.includes('auth') || message.includes('login')) {
      return 'Authentication failed. Please log in again to continue.';
    }
    
    // File/upload errors
    if (message.includes('file') || message.includes('upload')) {
      return 'File processing failed. Please ensure the file is valid and try uploading again.';
    }
    
    // Database errors
    if (message.includes('database') || message.includes('sql')) {
      return 'A database error occurred. Please try again or contact support if the problem persists.';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Please check your input data and ensure all required fields are properly filled.';
    }
    
    // Default fallback based on context
    switch (context.toLowerCase()) {
      case 'document generation':
        return 'Document generation failed. Please check your settings and try again.';
      case 'blueprint upload':
        return 'Blueprint upload failed. Please ensure the file is a valid CAD, PDF, or image file.';
      case 'compliance check':
        return 'Compliance check failed. Please verify your project data and try again.';
      case 'collaboration':
        return 'Collaboration feature encountered an error. Please refresh the page and try again.';
      default:
        return 'Something went wrong. Please try again or contact support if the problem continues.';
    }
  }

  static handleAsyncError(error: unknown, context: string, showToast: boolean = true): ErrorInfo {
    const errorInfo = this.handle(error, context);
    
    if (!showToast) {
      // Log only, don't show toast (useful for background operations)
      logger.error(`Background error in ${context}:`, errorInfo.message);
    }
    
    return errorInfo;
  }

  static createRetryHandler(
    operation: () => Promise<any>,
    context: string,
    maxRetries: number = 3,
    delay: number = 1000
  ) {
    return async (): Promise<any> => {
      let lastError: unknown;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) {
            this.handle(error, `${context} (after ${maxRetries} attempts)`);
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
      
      throw lastError;
    };
  }
}

export const useErrorHandler = () => {
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context: string = 'Operation',
    showUserError: boolean = true
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      if (showUserError) {
        ErrorHandler.handle(error, context);
      } else {
        ErrorHandler.handleAsyncError(error, context, false);
      }
      return null;
    }
  };

  const withRetry = <T>(
    operation: () => Promise<T>,
    context: string = 'Operation',
    maxRetries: number = 3
  ) => {
    return ErrorHandler.createRetryHandler(operation, context, maxRetries);
  };

  return { withErrorHandling, withRetry };
};
