
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useComplianceRules } from '@/hooks/compliance/useComplianceRules';
import { useComplianceViolations } from '@/hooks/compliance/useComplianceViolations';
import { useComplianceChecks } from '@/hooks/compliance/useComplianceChecks';
import { ComplianceStatsCards } from './ComplianceStatsCards';
import { JurisdictionInfoPanel } from './JurisdictionInfoPanel';
import { ComplianceActions } from './ComplianceActions';
import { JurisdictionSelector } from './JurisdictionSelector';
import { ComplianceViolationsList } from './ComplianceViolationsList';
import { ComplianceRulesList } from './ComplianceRulesList';
import type { ComplianceTemplateKey } from '@/types/complianceTemplate';

interface RefactoredMultiJurisdictionComplianceEngineProps {
  uploadId?: string;
  onOpenComplianceTemplate?: (key: ComplianceTemplateKey) => void;
}

export const RefactoredMultiJurisdictionComplianceEngine: React.FC<RefactoredMultiJurisdictionComplianceEngineProps> = ({
  uploadId,
  onOpenComplianceTemplate,
}) => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  
  const { complianceRules, rulesLoading } = useComplianceRules();
  const { violations, violationsLoading } = useComplianceViolations(uploadId);
  const { complianceChecks, runComplianceCheck, isRunningCheck } = useComplianceChecks(uploadId);

  const latestCheck = complianceChecks[0];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <Card className="skeuo-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-primary flex items-center space-x-2">
                  <Shield className="w-6 h-6" />
                  <span>Comprehensive Multi-Jurisdiction Compliance Engine v4.0</span>
                </CardTitle>
                <CardDescription className="text-foreground">
                  Advanced building code compliance across multiple jurisdictions with comprehensive coverage
                </CardDescription>
              </div>
              <ComplianceActions
                uploadId={uploadId}
                selectedJurisdiction={selectedJurisdiction}
                violations={violations}
                runComplianceCheck={runComplianceCheck}
                isRunningCheck={isRunningCheck}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Jurisdiction Selection */}
        <JurisdictionSelector
          onJurisdictionSelect={setSelectedJurisdiction}
          selectedJurisdiction={selectedJurisdiction}
          onOpenComplianceTemplate={onOpenComplianceTemplate}
        />

        {/* Compliance Dashboard */}
        {uploadId && selectedJurisdiction && (
          <>
            <JurisdictionInfoPanel jurisdictionId={selectedJurisdiction} />
            <ComplianceStatsCards violations={violations} />

            {/* Last Check Status */}
            {latestCheck && (
              <Card className="skeuo-panel">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Comprehensive Check</p>
                      <p className="text-sm text-foreground">
                        {new Date(latestCheck.started_at).toLocaleString()} - {latestCheck.status}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Rules: {latestCheck.rules_checked}</p>
                      <p>Violations: {latestCheck.violations_found}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs for different views */}
            <Tabs defaultValue="violations" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-card">
                <TabsTrigger value="violations" className="data-[state=active]:bg-primary/20">
                  Violations ({violations.length})
                </TabsTrigger>
                <TabsTrigger value="rules" className="data-[state=active]:bg-primary/20">
                  Rules ({complianceRules.length})
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
                  rules={complianceRules.filter(rule => 
                    rule.jurisdiction.includes(selectedJurisdiction) || 
                    rule.jurisdiction === 'Universal'
                  )} 
                  isLoading={rulesLoading}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};
