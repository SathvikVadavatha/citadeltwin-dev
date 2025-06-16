
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, FileText, Settings, Play, Download } from 'lucide-react';
import { useCompliance } from '@/hooks/useCompliance';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { JurisdictionSelector } from './JurisdictionSelector';
import { ComplianceViolationsList } from './ComplianceViolationsList';
import { ComplianceRulesList } from './ComplianceRulesList';
import { toast } from 'sonner';

interface MultiJurisdictionComplianceEngineProps {
  uploadId?: string;
}

export const MultiJurisdictionComplianceEngine: React.FC<MultiJurisdictionComplianceEngineProps> = ({ uploadId }) => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const { 
    complianceRules, 
    rulesLoading, 
    fetchViolations,
    fetchComplianceChecks,
    runComplianceCheck, 
    isRunningCheck 
  } = useCompliance();

  const { generateResponse, loading: aiLoading } = useGeminiAI();

  const { data: violations = [], isLoading: violationsLoading } = fetchViolations(uploadId);
  const { data: complianceChecks = [], isLoading: checksLoading } = fetchComplianceChecks(uploadId);

  const handleRunMultiJurisdictionCheck = async () => {
    if (!uploadId || !selectedJurisdiction) {
      toast.error('Please select an upload and jurisdiction first');
      return;
    }

    try {
      // Run compliance check with specific jurisdiction
      await runComplianceCheck({ 
        uploadId, 
        checkType: 'multi_jurisdiction',
        jurisdictionId: selectedJurisdiction 
      });
      
      toast.success('Multi-jurisdiction compliance check completed');
    } catch (error) {
      console.error('Multi-jurisdiction compliance check failed:', error);
      toast.error('Compliance check failed');
    }
  };

  const generateComplianceReport = async () => {
    if (!uploadId || !selectedJurisdiction) {
      toast.error('Please select an upload and jurisdiction first');
      return;
    }

    setIsGeneratingReport(true);
    
    try {
      // Generate comprehensive compliance report using Gemini AI
      const reportPrompt = `
        Generate a comprehensive building code compliance report for the following:
        
        Project Upload ID: ${uploadId}
        Jurisdiction: ${selectedJurisdiction}
        Violations Found: ${violations.length}
        
        Report Structure:
        1. Executive Summary
        2. Project Overview
        3. Applicable Building Codes and Standards
        4. Compliance Assessment Results
        5. Violations Analysis (by severity)
        6. Remediation Recommendations
        7. Timeline for Resolution
        8. Appendices (code references, calculations)
        
        For each violation, provide:
        - Code section reference
        - Current condition vs. required condition
        - Risk assessment
        - Specific remediation steps
        - Cost impact estimation
        - Timeline for correction
        
        Format as a professional engineering report suitable for submission to building authorities.
      `;

      const aiResponse = await generateResponse({
        prompt: reportPrompt,
        type: 'technical-consulting',
        context: 'You are a building code compliance expert generating official compliance reports.',
        maxTokens: 3000
      });

      if (aiResponse) {
        // Trigger document generation
        const response = await fetch('/api/generate-compliance-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId,
            jurisdictionId: selectedJurisdiction,
            reportContent: aiResponse.result,
            format: reportFormat,
            violations: violations
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `compliance-report-${selectedJurisdiction}-${new Date().toISOString().split('T')[0]}.${reportFormat}`;
          a.click();
          
          toast.success(`Compliance report generated and downloaded as ${reportFormat.toUpperCase()}`);
        } else {
          toast.error('Failed to generate compliance report');
        }
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
      toast.error('Failed to generate compliance report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getComplianceStats = () => {
    const stats = {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'critical').length,
      major: violations.filter(v => v.severity === 'major').length,
      minor: violations.filter(v => v.severity === 'minor').length,
      warning: violations.filter(v => v.severity === 'warning').length,
    };
    
    const complianceScore = Math.max(0, 100 - (stats.critical * 10 + stats.major * 5 + stats.minor * 2 + stats.warning * 1));
    
    return { ...stats, complianceScore };
  };

  const stats = getComplianceStats();
  const latestCheck = complianceChecks[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="cyber-tool-palette">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-cyan-400">Multi-Jurisdiction Compliance Engine</CardTitle>
              <CardDescription className="text-gray-300">
                Comprehensive building code compliance across multiple jurisdictions with AI-powered reporting
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleRunMultiJurisdictionCheck}
                disabled={!uploadId || !selectedJurisdiction || isRunningCheck}
                className="cyber-button"
              >
                {isRunningCheck ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Running Check...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Multi-Jurisdiction Check
                  </>
                )}
              </Button>
              
              <Select value={reportFormat} onValueChange={(value: 'pdf' | 'docx') => setReportFormat(value)}>
                <SelectTrigger className="w-24 bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={generateComplianceReport}
                disabled={!uploadId || !selectedJurisdiction || isGeneratingReport || violations.length === 0}
                className="cyber-button"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Jurisdiction Selection */}
      <JurisdictionSelector
        onJurisdictionSelect={setSelectedJurisdiction}
        selectedJurisdiction={selectedJurisdiction}
      />

      {/* Compliance Dashboard */}
      {uploadId && selectedJurisdiction && (
        <>
          {/* Compliance Score & Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="cyber-tool-palette md:col-span-2">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">
                    {stats.complianceScore}%
                  </div>
                  <p className="text-sm text-gray-400">Compliance Score</p>
                  <div className="mt-2">
                    {stats.complianceScore >= 90 ? (
                      <Badge className="bg-green-900 text-green-300">Excellent</Badge>
                    ) : stats.complianceScore >= 70 ? (
                      <Badge className="bg-yellow-900 text-yellow-300">Good</Badge>
                    ) : (
                      <Badge className="bg-red-900 text-red-300">Needs Improvement</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-tool-palette">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
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
                  <Settings className="w-5 h-5 text-cyan-400" />
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

          {/* Last Check Status */}
          {latestCheck && (
            <Card className="cyber-tool-palette">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Last Multi-Jurisdiction Check</p>
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
                    <p className="text-sm text-gray-400">Jurisdiction: {selectedJurisdiction}</p>
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
                Violations ({violations.length})
              </TabsTrigger>
              <TabsTrigger value="rules" className="data-[state=active]:bg-cyan-900">
                Applicable Rules ({complianceRules.length})
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
                  // Filter rules by selected jurisdiction
                  rule.jurisdiction.includes(selectedJurisdiction) || 
                  rule.jurisdiction === 'Universal' ||
                  rule.jurisdiction === 'IBC 2021'
                )} 
                isLoading={rulesLoading}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
