
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, XCircle, Play, RefreshCw } from 'lucide-react';
import { useCompliance } from '@/hooks/useCompliance';
import { ComplianceViolationsList } from './ComplianceViolationsList';
import { ComplianceRulesList } from './ComplianceRulesList';

interface ComplianceEngineProps {
  uploadId?: string;
}

export const ComplianceEngine: React.FC<ComplianceEngineProps> = ({ uploadId }) => {
  const { 
    complianceRules, 
    rulesLoading, 
    fetchViolations,
    fetchComplianceChecks,
    runComplianceCheck, 
    isRunningCheck 
  } = useCompliance();

  const { data: violations = [], isLoading: violationsLoading } = fetchViolations(uploadId);
  const { data: complianceChecks = [], isLoading: checksLoading } = fetchComplianceChecks(uploadId);

  const handleRunComplianceCheck = () => {
    if (uploadId) {
      runComplianceCheck({ uploadId });
    }
  };

  const getViolationStats = () => {
    const stats = {
      critical: violations.filter(v => v.severity === 'critical').length,
      major: violations.filter(v => v.severity === 'major').length,
      minor: violations.filter(v => v.severity === 'minor').length,
      warning: violations.filter(v => v.severity === 'warning').length,
    };
    return stats;
  };

  const stats = getViolationStats();
  const latestCheck = complianceChecks[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="cyber-tool-palette">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-cyan-400">Building Code Compliance Engine</CardTitle>
              <CardDescription className="text-gray-300">
                IBC 2021 compliance checking with AI-powered remediation suggestions
              </CardDescription>
            </div>
            <Button
              onClick={handleRunComplianceCheck}
              disabled={!uploadId || isRunningCheck}
              className="cyber-button"
            >
              {isRunningCheck ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Check...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Compliance Check
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Compliance Summary */}
      {uploadId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cyber-tool-palette">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">Critical</p>
                  <p className="text-xl font-bold text-red-400">{stats.critical}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-tool-palette">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Major</p>
                  <p className="text-xl font-bold text-yellow-400">{stats.major}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-tool-palette">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-gray-400">Minor</p>
                  <p className="text-xl font-bold text-cyan-400">{stats.minor}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-tool-palette">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Warnings</p>
                  <p className="text-xl font-bold text-green-400">{stats.warning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Check Status */}
      {latestCheck && (
        <Card className="cyber-tool-palette">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Last Compliance Check</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge 
                    variant={latestCheck.status === 'completed' ? 'default' : 'destructive'}
                    className={latestCheck.status === 'completed' ? 'bg-green-900 text-green-300' : ''}
                  >
                    {latestCheck.status}
                  </Badge>
                  <span className="text-sm text-gray-300">
                    {new Date(latestCheck.started_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Rules Checked: {latestCheck.rules_checked}</p>
                <p className="text-sm text-gray-400">Violations Found: {latestCheck.violations_found}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
