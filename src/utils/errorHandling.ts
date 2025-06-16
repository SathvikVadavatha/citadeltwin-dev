
import { toast } from 'sonner';
import { logger } from './logger';

export interface AppError {
  id: string;
  message: string;
  code?: string;
  category: 'network' | 'validation' | 'calculation' | 'system' | 'user' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
  details?: any;
  timestamp: Date;
  userMessage?: string;
  suggestions?: string[];
  recoverable: boolean;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: 'retry' | 'fallback' | 'reset' | 'navigate';
}

export class ErrorHandler {
  private static errorHistory: AppError[] = [];
  private static maxHistorySize = 100;

  static handle(error: unknown, context?: string, options: {
    showToast?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    category?: AppError['category'];
    severity?: AppError['severity'];
    userMessage?: string;
    suggestions?: string[];
    recoveryActions?: ErrorRecoveryAction[];
  } = {}): AppError {
    const {
      showToast = true,
      logLevel = 'error',
      category = 'unknown',
      severity = 'medium',
      userMessage,
      suggestions = [],
      recoveryActions = []
    } = options;

    const appError = this.createAppError(error, context, category, severity, userMessage, suggestions);
    
    // Add to error history
    this.addToHistory(appError);
    
    // Log the error
    this.logError(appError, logLevel);
    
    // Show user notification if requested
    if (showToast) {
      this.showErrorToast(appError, recoveryActions);
    }
    
    return appError;
  }

  private static createAppError(
    error: unknown,
    context?: string,
    category: AppError['category'] = 'unknown',
    severity: AppError['severity'] = 'medium',
    userMessage?: string,
    suggestions: string[] = []
  ): AppError {
    const id = this.generateErrorId();
    let message = 'An unexpected error occurred';
    let code: string | undefined;
    let details: any;
    let recoverable = true;

    if (error instanceof Error) {
      message = error.message;
      details = {
        name: error.name,
        stack: error.stack,
        cause: error.cause
      };
      
      // Check if it's a specific error type
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        category = 'network';
        suggestions.push('Check your internet connection and try again');
        suggestions.push('Contact support if the problem persists');
      } else if (error.name === 'ValidationError') {
        category = 'validation';
        severity = 'low';
        suggestions.push('Please check your input and try again');
      } else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
        category = 'system';
        severity = 'high';
        recoverable = false;
        suggestions.push('This appears to be a system error. Please refresh the page');
      }
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = (error as any).message || 'Unknown error';
      code = (error as any).code;
      details = error;
      
      // Handle API errors
      if ((error as any).status || (error as any).statusCode) {
        category = 'network';
        const status = (error as any).status || (error as any).statusCode;
        
        if (status >= 400 && status < 500) {
          severity = 'medium';
          suggestions.push('Please check your input and try again');
        } else if (status >= 500) {
          severity = 'high';
          suggestions.push('Server error - please try again later');
        }
      }
    }

    // Generate user-friendly message if not provided
    if (!userMessage) {
      userMessage = this.generateUserFriendlyMessage(message, category);
    }

    return {
      id,
      message,
      code,
      category,
      severity,
      context,
      details,
      timestamp: new Date(),
      userMessage,
      suggestions,
      recoverable
    };
  }

  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateUserFriendlyMessage(message: string, category: AppError['category']): string {
    switch (category) {
      case 'network':
        return 'Connection problem - please check your internet and try again';
      case 'validation':
        return 'Please check your input and try again';
      case 'calculation':
        return 'Calculation error - please verify your data';
      case 'system':
        return 'System error - please refresh the page or contact support';
      case 'user':
        return 'Please check your input and try again';
      default:
        return 'Something went wrong - please try again';
    }
  }

  private static addToHistory(error: AppError): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  private static logError(error: AppError, level: 'debug' | 'info' | 'warn' | 'error'): void {
    const logMessage = `[${error.category.toUpperCase()}] ${error.message}`;
    const logData = {
      id: error.id,
      code: error.code,
      severity: error.severity,
      context: error.context,
      recoverable: error.recoverable,
      details: error.details
    };

    switch (level) {
      case 'debug':
        logger.debug(logMessage, error.context, logData);
        break;
      case 'info':
        logger.info(logMessage, error.context, logData);
        break;
      case 'warn':
        logger.warn(logMessage, error.context, logData);
        break;
      case 'error':
        logger.error(logMessage, error.context, logData);
        break;
    }
  }

  private static showErrorToast(error: AppError, recoveryActions: ErrorRecoveryAction[]): void {
    const toastMessage = error.userMessage || error.message;
    
    switch (error.severity) {
      case 'low':
        toast.info(toastMessage);
        break;
      case 'medium':
        toast.warning(toastMessage);
        break;
      case 'high':
      case 'critical':
        toast.error(toastMessage, {
          description: error.suggestions.length > 0 ? error.suggestions[0] : undefined,
          action: recoveryActions.length > 0 ? {
            label: recoveryActions[0].label,
            onClick: recoveryActions[0].action
          } : undefined
        });
        break;
    }
  }

  static showToast(error: unknown, context?: string): AppError {
    return this.handle(error, context, { showToast: true });
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string,
    options: {
      showToast?: boolean;
      fallback?: T;
      retryAttempts?: number;
      retryDelay?: number;
    } = {}
  ): Promise<T | null> {
    const { showToast = true, fallback, retryAttempts = 0, retryDelay = 1000 } = options;
    
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < retryAttempts) {
          // Log retry attempt
          logger.warn(`Retry attempt ${attempt + 1}/${retryAttempts} for ${context}`, context, { error });
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // Final attempt failed
        this.handle(error, context, { 
          showToast,
          category: 'system',
          severity: retryAttempts > 0 ? 'high' : 'medium'
        });
        
        if (fallback !== undefined) {
          return fallback;
        }
        
        return null;
      }
    }
    
    return null;
  }

  static getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  static getErrorsByCategory(category: AppError['category']): AppError[] {
    return this.errorHistory.filter(error => error.category === category);
  }

  static getRecentErrors(minutes: number = 5): AppError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorHistory.filter(error => error.timestamp > cutoff);
  }

  static clearErrorHistory(): void {
    this.errorHistory = [];
  }

  static getErrorStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCount: number;
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    this.errorHistory.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    
    const recentCount = this.getRecentErrors(5).length;
    
    return {
      total: this.errorHistory.length,
      byCategory,
      bySeverity,
      recentCount
    };
  }
}

// Utility hook for error handling
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: string, options?: Parameters<typeof ErrorHandler.handle>[2]) => {
    return ErrorHandler.handle(error, context, options);
  };

  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context?: string,
    options?: Parameters<typeof ErrorHandler.withErrorHandling>[2]
  ): Promise<T | null> => {
    return ErrorHandler.withErrorHandling(operation, context, options);
  };

  const showErrorToast = (error: unknown, context?: string) => {
    return ErrorHandler.showToast(error, context);
  };

  return { 
    handleError, 
    withErrorHandling, 
    showErrorToast,
    getErrorHistory: ErrorHandler.getErrorHistory,
    getErrorStats: ErrorHandler.getErrorStats
  };
};
