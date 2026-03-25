import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface FallbackUIProps {
  error?: Error;
  onRetry?: () => void;
  onHome?: () => void;
  title?: string;
  message?: string;
}

export const FallbackUI: React.FC<FallbackUIProps> = ({
  error,
  onRetry,
  onHome,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again."
}) => {
  console.log('FallbackUI rendering:', { error: error?.message });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground"
    >
      <div
        className="max-w-md w-full text-center p-8 rounded-lg border bg-card border-border"
      >
        <AlertTriangle
          className="w-16 h-16 mx-auto mb-4 text-destructive"
        />

        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="mb-6 opacity-80">{message}</p>

        {error && (
          <div
            className="text-sm p-3 rounded mb-6 text-left bg-muted text-destructive/80"
          >
            <strong>Error:</strong> {error.message}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};