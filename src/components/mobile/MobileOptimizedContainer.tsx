
import React from 'react';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

interface MobileOptimizedContainerProps {
  children: React.ReactNode;
  className?: string;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
}

export const MobileOptimizedContainer: React.FC<MobileOptimizedContainerProps> = ({
  children,
  className,
  enablePullToRefresh = false,
  onRefresh
}) => {
  const { isMobile, isTouch, orientation } = useViewport();

  return (
    <div
      className={cn(
        'w-full',
        isMobile && [
          'min-h-screen',
          'overflow-x-hidden',
          'touch-manipulation',
          'px-4 py-2',
          orientation === 'landscape' ? 'py-1' : 'py-2'
        ],
        !isMobile && 'container mx-auto px-6 py-4',
        isTouch && [
          'select-none',
          '[&_button]:min-h-touch',
          '[&_input]:min-h-touch',
          '[&_select]:min-h-touch'
        ],
        className
      )}
      style={{
        paddingTop: isMobile ? 'max(1rem, env(safe-area-inset-top))' : undefined,
        paddingBottom: isMobile ? 'max(1rem, env(safe-area-inset-bottom))' : undefined,
        paddingLeft: isMobile ? 'max(1rem, env(safe-area-inset-left))' : undefined,
        paddingRight: isMobile ? 'max(1rem, env(safe-area-inset-right))' : undefined,
      }}
    >
      {children}
    </div>
  );
};
