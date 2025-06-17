
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureErrorBoundary } from '@/components/error/FeatureErrorBoundary';
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';
import { useComplianceRules } from '@/hooks/compliance/useComplianceRules';
import { useComplianceViolations } from '@/hooks/compliance/useComplianceViolations';
import { useComplianceChecks } from '@/hooks/compliance/useComplianceChecks';
import { ComplianceViolationsList } from './ComplianceViolationsList';
import { ComplianceRulesList } from './ComplianceRulesList';
import { MultiJurisdictionComplianceEngine } from './MultiJurisdictionComplianceEngine';
import { ComplianceEngineSelector, type EngineType } from './ComplianceEngineSelector';
import { ComplianceStats } from './ComplianceStats';
import { ComplianceCheckStatus } from './ComplianceCheckStatus';
import { StandardComplianceHeader } from './StandardComplianceHeader';

interface ComplianceEngineProps {
  uploadId?: string;
}

export const ComplianceEngine: React.FC<ComplianceEngineProps> = ({ uploadId }) => {
  const [activeEngine, setActiveEngine] = useState<EngineType>('multi_jurisdiction');
  
  const { complianceRules, rulesLoading } = useComplianceRules();
  const { violations, violationsLoading, updateViolationStatus } = useComplianceViolations(uploadId);
  const { complianceChecks, checksLoading, runComplianceCheck, isRunningCheck } = useComplianceChecks(uploadId);

  const handleRunStandardComplianceCheck = () => {
    if (uploadId) {
      runComplianceCheck({ uploadId });
    }
  };

  const latestCheck = complianceChecks[0];

  if (activeEngine === 'multi_jurisdiction') {
    return (
      <FeatureErrorBoundary featureName="Multi-Jurisdiction Compliance Engine">
        <MultiJurisdictionComplianceEngine uploadId={uploadId} />
      </FeatureErrorBoundary>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engine Selection */}
      <FeatureErrorBoundary featureName="Compliance Engine Selector">
        <ComplianceEngineSelector 
          activeEngine={activeEngine}
          onEngineChange={setActiveEngine}
        />
      </FeatureErrorBoundary>

      {/* Header */}
      <FeatureErrorBoundary featureName="Compliance Header">
        <StandardComplianceHeader
          uploadId={uploadId}
          isRunningCheck={isRunningCheck}
          onRunComplianceCheck={handleRunStandardComplianceCheck}
        />
      </FeatureErrorBoundary>

      {/* Compliance Summary */}
      {uploadId && (
        <AsyncErrorBoundary errorMessage="Failed to load compliance statistics">
          <ComplianceStats violations={violations} />
        </AsyncErrorBoundary>
      )}

      {/* Last Check Status */}
      <FeatureErrorBoundary featureName="Check Status">
        <ComplianceCheckStatus latestCheck={latestCheck} />
      </FeatureErrorBoundary>

      {/* Tabs for different views */}
      <Tabs defaultValue="violations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900">
          <TabsTrigger value="violations" className="data-[state=active]:bg-cyan-900">
            Violations
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-cyan-900">
            Rules Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <AsyncErrorBoundary 
            errorMessage="Failed to load compliance violations"
            onRetry={() => window.location.reload()}
          >
            <ComplianceViolationsList 
              violations={violations} 
              isLoading={violationsLoading}
              uploadId={uploadId}
            />
          </AsyncErrorBoundary>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <AsyncErrorBoundary 
            errorMessage="Failed to load compliance rules"
            onRetry={() => window.location.reload()}
          >
            <ComplianceRulesList 
              rules={complianceRules} 
              isLoading={rulesLoading}
            />
          </AsyncErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};
