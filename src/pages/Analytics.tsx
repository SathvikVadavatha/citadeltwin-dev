
import React from 'react';
import { PerformanceAnalyticsDashboard } from '@/components/analytics/PerformanceAnalyticsDashboard';
import { useViewport } from '@/hooks/useViewport';

export const Analytics: React.FC = () => {
  const { isMobile } = useViewport();
  
  return (
    <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'}`}>
      <PerformanceAnalyticsDashboard />
    </div>
  );
};
