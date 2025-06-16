
import React from 'react';
import { FEAAnalysisManager } from '@/components/fea/FEAAnalysisManager';
import { useViewport } from '@/hooks/useViewport';

export const FEAAnalysis: React.FC = () => {
  const { isMobile } = useViewport();
  
  return (
    <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'}`}>
      <div className="space-y-6">
        <div>
          <h1 className={`font-bold text-foreground ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Advanced FEA Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive finite element analysis with dynamic, buckling, and advanced material modeling capabilities
          </p>
        </div>
        
        <FEAAnalysisManager />
      </div>
    </div>
  );
};
