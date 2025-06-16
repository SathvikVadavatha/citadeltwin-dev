
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    return <MultiJurisdictionComplianceEngine uploadId={uploadId} />;
  }

  return (
    <div className="space-y-6">
      {/* Engine Selection */}
      <ComplianceEngineSelector 
        activeEngine={activeEngine}
        onEngineChange={setActiveEngine}
      />

      {/* Header */}
      <StandardComplianceHeader
        uploadId={uploadId}
        isRunningCheck={isRunningCheck}
        onRunComplianceCheck={handleRunStandardComplianceCheck}
      />

      {/* Compliance Summary */}
      {uploadId && <ComplianceStats violations={violations} />}

      {/* Last Check Status */}
      <ComplianceCheckStatus latestCheck={latestCheck} />

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
          <ComplianceViolationsList 
            violations={violations} 
            isLoading={violationsLoading}
            uploadId={uploadId}
          />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <ComplianceRulesList 
            rules={complianceRules} 
            isLoading={rulesLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
