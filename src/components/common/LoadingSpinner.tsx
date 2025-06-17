
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  variant?: 'default' | 'inline' | 'overlay';
}

export const LoadingSpinner = ({ 
  size = 'md', 
  className, 
  text,
  variant = 'default' 
}: LoadingSpinnerProps) => {
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
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <p className={cn('text-muted-foreground', textSizes[size])}>{text}</p>}
    </div>
  );
};
