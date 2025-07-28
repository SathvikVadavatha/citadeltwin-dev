
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  console.log('ProtectedRoute rendering...');
  const { user, loading, error, clearError } = useAuth();
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [showError, setShowError] = useState(false);
  
  console.log('Auth state:', { user: !!user, loading, error, showError });

  // Show error after a delay to avoid flashing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setShowError(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [error]);

  // Handle retry logic
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    clearError();
    setShowError(false);
    // Force a page reload to reinitialize auth
    window.location.reload();
  };

  // Show loading state
  if (loading && !showError) {
    console.log('Showing loading state');
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        style={{ 
          backgroundColor: 'hsl(240, 20%, 4%)', 
          color: 'hsl(224, 71%, 85%)',
          minHeight: '100vh'
        }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Checking authentication...</p>
              {retryCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Retry attempt {retryCount}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state with retry option
  if (error && showError) {
    console.log('Showing error state');
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        style={{ 
          backgroundColor: 'hsl(240, 20%, 4%)', 
          color: 'hsl(224, 71%, 85%)',
          minHeight: '100vh'
        }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Authentication Error</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button asChild size="sm">
                  <Navigate to="/auth/login" replace />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login with return path
  if (!user && !loading) {
    const returnTo = location.pathname !== '/auth/login' ? location.pathname : '/dashboard';
    return (
      <Navigate 
        to={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`} 
        replace 
      />
    );
  }

  // Render protected content
  console.log('Rendering protected content');
  return <>{children}</>;
};
