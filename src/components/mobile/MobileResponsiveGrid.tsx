
import React from 'react';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

interface MobileResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  mobileColumns?: 1 | 2;
  tabletColumns?: 2 | 3 | 4;
  desktopColumns?: 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

export const MobileResponsiveGrid: React.FC<MobileResponsiveGridProps> = ({
  children,
  className,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md'
}) => {
  const { isMobile, isTablet } = useViewport();

  const getGridClasses = () => {
    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6'
    };

    const mobileClass = `grid-cols-${mobileColumns}`;
    const tabletClass = `md:grid-cols-${tabletColumns}`;
    const desktopClass = `lg:grid-cols-${desktopColumns}`;

    return cn(
      'grid',
      gapClasses[gap],
      mobileClass,
      tabletClass,
      desktopClass
    );
  };

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  );
};
