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
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'hsl(240, 20%, 4%)', 
        color: 'hsl(224, 71%, 85%)'
      }}
    >
      <div 
        className="max-w-md w-full text-center p-8 rounded-lg border"
        style={{ 
          backgroundColor: 'hsl(240, 20%, 8%)', 
          borderColor: 'hsl(240, 20%, 15%)'
        }}
      >
        <AlertTriangle 
          className="w-16 h-16 mx-auto mb-4"
          style={{ color: 'hsl(10, 80%, 60%)' }}
        />
        
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="mb-6 opacity-80">{message}</p>
        
        {error && (
          <div 
            className="text-sm p-3 rounded mb-6 text-left"
            style={{ 
              backgroundColor: 'hsl(240, 20%, 12%)', 
              color: 'hsl(10, 50%, 70%)'
            }}
          >
            <strong>Error:</strong> {error.message}
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
              style={{ 
                backgroundColor: 'hsl(197, 80%, 50%)', 
                color: 'white' 
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          
          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
              style={{ 
                backgroundColor: 'hsl(240, 20%, 20%)', 
                color: 'hsl(224, 71%, 85%)',
                border: '1px solid hsl(240, 20%, 30%)'
              }}
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