
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

interface MobileResponsiveCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const MobileResponsiveCard: React.FC<MobileResponsiveCardProps> = ({
  title,
  description,
  children,
  className,
  compact = false
}) => {
  const { isMobile, isTouch } = useViewport();

  return (
    <Card
      className={cn(
        'w-full',
        isMobile && [
          'border-0 shadow-sm',
          'bg-card/95 backdrop-blur-sm',
          compact ? 'rounded-lg' : 'rounded-xl'
        ],
        !isMobile && 'border shadow-md',
        isTouch && 'touch-manipulation',
        className
      )}
    >
      {(title || description) && (
        <CardHeader className={cn(
          isMobile && (compact ? 'p-4 pb-2' : 'p-4'),
          !isMobile && 'p-6'
        )}>
          {title && (
            <CardTitle className={cn(
              isMobile ? 'text-lg' : 'text-xl',
              'leading-tight'
            )}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={cn(
              isMobile ? 'text-sm' : 'text-base',
              'leading-relaxed'
            )}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        isMobile && (compact ? 'p-4 pt-0' : 'p-4'),
        !isMobile && 'p-6',
        title || description ? 'pt-0' : ''
      )}>
        {children}
      </CardContent>
    </Card>
  );
};
