
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Loader2, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showHomeButton?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  isRetrying: boolean;
  retryCount: number;
}

export class EnhancedAsyncErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      isRetrying: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EnhancedAsyncErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });
    
    try {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.setState({ 
        hasError: false, 
        error: undefined, 
        isRetrying: false,
        retryCount: this.state.retryCount + 1
      });
    } catch (error) {
      console.error('Retry failed:', error);
      this.setState({ isRetrying: false });
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.props.showRetry !== false && this.state.retryCount < this.maxRetries;
      const context = this.props.context || 'Application';

      return (
        <Card className="w-full max-w-lg mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              {this.state.isRetrying ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">Retrying...</p>
                    <p className="text-sm text-muted-foreground">
                      Attempting to recover from the error
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">{context} Error</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    {this.state.retryCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Retry attempts: {this.state.retryCount}/{this.maxRetries}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    {canRetry && (
                      <Button onClick={this.handleRetry} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    )}
                    
                    {this.props.showHomeButton !== false && (
                      <Button onClick={this.handleGoHome} variant="default" size="sm">
                        <Home className="h-4 w-4 mr-2" />
                        Go Home
                      </Button>
                    )}
                  </div>

                  {this.state.retryCount >= this.maxRetries && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Maximum retry attempts reached. Please refresh the page or contact support if the issue persists.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
