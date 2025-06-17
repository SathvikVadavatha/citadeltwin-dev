
import React from 'react';
import { Loader2, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  variant?: 'default' | 'inline' | 'overlay';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className, 
  text,
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        {text && <span className={textSizes[size]}>{text}</span>}
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className={cn('absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50', className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className={cn('animate-spin', sizeClasses[size])} />
          {text && <p className={cn('text-muted-foreground', textSizes[size])}>{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 p-8', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <p className={cn('text-muted-foreground', textSizes[size])}>{text}</p>}
    </div>
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ title, description, className }) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {title && <h3 className="font-medium">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground text-center">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = "Something went wrong", 
  message, 
  onRetry, 
  className 
}) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="font-medium text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon, 
  action, 
  className 
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="font-medium text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
