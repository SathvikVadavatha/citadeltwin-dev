
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  showErrorDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`FeatureErrorBoundary caught error in ${this.props.featureName}:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              {this.props.featureName} Error
            </CardTitle>
            <CardDescription>
              This feature encountered an error and couldn't load properly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.retryCount > 0 && (
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  Retry attempt #{this.state.retryCount}. If the problem persists, 
                  please refresh the page or contact support.
                </AlertDescription>
              </Alert>
            )}
            
            {this.props.showErrorDetails && this.state.error && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded border">
                <strong>Technical Details:</strong>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
              </div>
            )}
            
            <Button onClick={this.handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry {this.props.featureName}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
