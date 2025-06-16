
import React from 'react';
import { useStablePerformanceMetrics } from '@/hooks/useStablePerformanceMetrics';
import { AnalysisHeader } from './analysis/AnalysisHeader';
import { IssuesSection } from './analysis/IssuesSection';
import { useAnalysisData } from './analysis/useAnalysisData';

export const RenderingAnalysisDashboard: React.FC = () => {
  const { metrics, isMonitoring, startMonitoring, stopMonitoring } = useStablePerformanceMetrics({
    enabled: true,
    interval: 2000,
    developmentOnly: false
  });

  const { detectedIssues, isAnalyzing, runAnalysis } = useAnalysisData(isMonitoring);

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  return (
    <div className="space-y-6">
      <AnalysisHeader
        metrics={metrics}
        isMonitoring={isMonitoring}
        isAnalyzing={isAnalyzing}
        onRunAnalysis={runAnalysis}
        onToggleMonitoring={handleToggleMonitoring}
      />
      
      <IssuesSection
        issues={detectedIssues}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};
