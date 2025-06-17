
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  isRetrying: boolean;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isRetrying: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AsyncErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = async () => {
    if (this.props.onRetry) {
      this.setState({ isRetrying: true });
      try {
        await this.props.onRetry();
        this.setState({ hasError: false, error: undefined, isRetrying: false });
      } catch (error) {
        console.error('Retry failed:', error);
        this.setState({ isRetrying: false });
      }
    } else {
      this.setState({ hasError: false, error: undefined, isRetrying: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              {this.state.isRetrying ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">Retrying operation...</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">Operation Failed</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {this.props.errorMessage || this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                  </div>
                  <Button onClick={this.handleRetry} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
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
