
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, FileText, Settings, Play, Download, Snowflake, Waves, Wind, Shield } from 'lucide-react';
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
      // Run comprehensive compliance check with specific jurisdiction
      await runComplianceCheck({ 
        uploadId, 
        checkType: 'multi_jurisdiction',
        jurisdictionId: selectedJurisdiction 
      });
      
      toast.success('Comprehensive multi-jurisdiction compliance check completed');
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
        
        This is a COMPREHENSIVE MULTI-JURISDICTION analysis covering:
        - Standard IBC requirements
        - State-specific building codes
        - Climate-specific requirements (snow loads, hurricane resistance, etc.)
        - Energy efficiency standards
        - Accessibility requirements
        - Fire safety and life safety codes
        - Environmental and coastal requirements
        
        Report Structure:
        1. Executive Summary
        2. Project Overview & Jurisdiction Analysis
        3. Applicable Building Codes and Standards
        4. Comprehensive Compliance Assessment Results
        5. Violations Analysis (by severity and type)
        6. Climate-Specific Requirements Analysis
        7. Detailed Remediation Recommendations
        8. Timeline for Resolution with Priorities
        9. Cost Impact Estimation
        10. Appendices (code references, calculations, climate data)
        
        For each violation, provide:
        - Specific code section reference
        - Current condition vs. required condition
        - Climate/environmental risk assessment
        - Specific remediation steps with technical details
        - Cost impact estimation and alternatives
        - Timeline for correction with dependencies
        - Jurisdiction-specific approval processes
        
        Special Focus Areas:
        - Ohio: Snow loads, frost depth, energy efficiency, accessibility
        - Florida: Hurricane resistance, flood protection, coastal requirements, termite protection
        - All jurisdictions: Life safety, structural integrity, environmental compliance
        
        Format as a professional engineering report suitable for submission to building authorities.
      `;

      const aiResponse = await generateResponse({
        prompt: reportPrompt,
        type: 'technical-consulting',
        context: 'You are a building code compliance expert generating official comprehensive compliance reports for multi-jurisdiction analysis.',
        maxTokens: 4000
      });

      if (aiResponse) {
        // Trigger comprehensive document generation
        const response = await fetch('/api/generate-compliance-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId,
            jurisdictionId: selectedJurisdiction,
            reportContent: aiResponse.result,
            format: reportFormat,
            violations: violations,
            reportType: 'comprehensive_multi_jurisdiction',
            engineVersion: '4.0-comprehensive'
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `comprehensive-compliance-report-${selectedJurisdiction}-${new Date().toISOString().split('T')[0]}.${reportFormat}`;
          a.click();
          
          toast.success(`Comprehensive compliance report generated and downloaded as ${reportFormat.toUpperCase()}`);
        } else {
          toast.error('Failed to generate comprehensive compliance report');
        }
      }
    } catch (error) {
      console.error('Error generating comprehensive compliance report:', error);
      toast.error('Failed to generate comprehensive compliance report');
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
      jurisdiction_specific: violations.filter(v => v.jurisdiction_specific).length,
    };
    
    const complianceScore = Math.max(0, 100 - (stats.critical * 15 + stats.major * 8 + stats.minor * 3 + stats.warning * 1));
    
    return { ...stats, complianceScore };
  };

  const getJurisdictionTypeInfo = (jurisdictionId: string) => {
    if (jurisdictionId.includes('OH')) {
      return {
        name: 'Ohio',
        icon: <Snowflake className="w-5 h-5 text-blue-400" />,
        specialties: ['Snow Load (30 psf)', 'Frost Depth (42")', 'Energy Code (5A)', 'Wind (90 mph)'],
        climate: 'Cold climate with snow and frost considerations'
      };
    } else if (jurisdictionId.includes('FL')) {
      return {
        name: 'Florida',
        icon: <Waves className="w-5 h-5 text-cyan-400" />,
        specialties: ['Hurricane (150+ mph)', 'Flood Resistance', 'HVHZ Requirements', 'Coastal Protection'],
        climate: 'Hot-humid climate with hurricane and flood risks'
      };
    } else if (jurisdictionId.includes('TX')) {
      return {
        name: 'Texas',
        icon: <Wind className="w-5 h-5 text-yellow-400" />,
        specialties: ['Wind Load (130 mph)', 'Flood Zones', 'Energy Efficiency'],
        climate: 'Hot climate with high wind and flood considerations'
      };
    } else if (jurisdictionId.includes('CA')) {
      return {
        name: 'California',
        icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
        specialties: ['Seismic Design', 'Title 24 Energy', 'Enhanced Accessibility'],
        climate: 'Seismic zone with enhanced energy requirements'
      };
    } else if (jurisdictionId.includes('NYC') || jurisdictionId.includes('NY')) {
      return {
        name: 'New York',
        icon: <Shield className="w-5 h-5 text-purple-400" />,
        specialties: ['Fire Safety', 'Enhanced Egress', 'High-Rise Requirements'],
        climate: 'Urban environment with enhanced safety requirements'
      };
    }
    
    return {
      name: 'Standard',
      icon: <Settings className="w-5 h-5 text-gray-400" />,
      specialties: ['IBC Requirements'],
      climate: 'Standard building code requirements'
    };
  };

  const stats = getComplianceStats();
  const latestCheck = complianceChecks[0];
  const jurisdictionInfo = getJurisdictionTypeInfo(selectedJurisdiction);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="cyber-tool-palette">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-cyan-400 flex items-center space-x-2">
                <Shield className="w-6 h-6" />
                <span>Comprehensive Multi-Jurisdiction Compliance Engine v4.0</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Advanced building code compliance across multiple jurisdictions with comprehensive Ohio and Florida coverage,
                including climate-specific requirements, energy codes, and life safety standards
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleRunMultiJurisdictionCheck}
                disabled={!uploadId || !selectedJurisdiction || isRunningCheck}
                className="cyber-button"
                size="lg"
              >
                {isRunningCheck ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Running Comprehensive Check...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Comprehensive Check
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
                size="lg"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Comprehensive Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Jurisdiction Selection */}
      <JurisdictionSelector
        onJurisdictionSelect={setSelectedJurisdiction}
        selectedJurisdiction={selectedJurisdiction}
      />

      {/* Comprehensive Compliance Dashboard */}
      {uploadId && selectedJurisdiction && (
        <>
          {/* Jurisdiction-Specific Information */}
          <Card className="cyber-tool-palette">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {jurisdictionInfo.icon}
                  <div>
                    <h3 className="font-semibold text-cyan-400">{jurisdictionInfo.name} Compliance Analysis</h3>
                    <p className="text-sm text-gray-400">{jurisdictionInfo.climate}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {jurisdictionInfo.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="outline" className="border-cyan-600 text-cyan-300">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Compliance Score & Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="cyber-tool-palette md:col-span-2">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">
                    {stats.complianceScore}%
                  </div>
                  <p className="text-sm text-gray-400">Comprehensive Compliance Score</p>
                  <div className="mt-2 space-y-1">
                    {stats.complianceScore >= 95 ? (
                      <Badge className="bg-green-900 text-green-300">Excellent</Badge>
                    ) : stats.complianceScore >= 85 ? (
                      <Badge className="bg-blue-900 text-blue-300">Very Good</Badge>
                    ) : stats.complianceScore >= 70 ? (
                      <Badge className="bg-yellow-900 text-yellow-300">Good</Badge>
                    ) : (
                      <Badge className="bg-red-900 text-red-300">Needs Improvement</Badge>
                    )}
                    <div className="text-xs text-gray-500">
                      {stats.jurisdiction_specific} jurisdiction-specific violations
                    </div>
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

          {/* Enhanced Last Check Status */}
          {latestCheck && (
            <Card className="cyber-tool-palette">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Last Comprehensive Multi-Jurisdiction Check</p>
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
                      {latestCheck.metadata?.engine_version && (
                        <Badge variant="outline" className="text-xs border-gray-600">
                          {latestCheck.metadata.engine_version}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Jurisdiction: {jurisdictionInfo.name}</p>
                    <p className="text-sm text-gray-400">Rules Checked: {latestCheck.rules_checked}</p>
                    <p className="text-sm text-gray-400">Violations Found: {latestCheck.violations_found}</p>
                    <p className="text-sm text-gray-400">Jurisdiction-Specific: {stats.jurisdiction_specific}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Tabs for different views */}
          <Tabs defaultValue="violations" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900">
              <TabsTrigger value="violations" className="data-[state=active]:bg-cyan-900">
                Comprehensive Violations ({violations.length})
              </TabsTrigger>
              <TabsTrigger value="rules" className="data-[state=active]:bg-cyan-900">
                Applicable Rules ({complianceRules.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="violations" className="space-y-4">
              <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                <h4 className="font-semibold text-cyan-400 mb-2">Comprehensive Analysis Coverage</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-300 font-medium">Building Codes</p>
                    <p className="text-xs text-gray-500">Height, Area, Occupancy</p>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium">Life Safety</p>
                    <p className="text-xs text-gray-500">Egress, Fire Safety, Accessibility</p>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium">Climate-Specific</p>
                    <p className="text-xs text-gray-500">Snow, Wind, Hurricane, Flood</p>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium">Environmental</p>
                    <p className="text-xs text-gray-500">Energy, Coastal, Seismic</p>
                  </div>
                </div>
              </div>
              <ComplianceViolationsList 
                violations={violations} 
                isLoading={violationsLoading}
                uploadId={uploadId}
              />
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <ComplianceRulesList 
                rules={complianceRules.filter(rule => 
                  // Enhanced filtering for jurisdiction-specific rules
                  rule.jurisdiction.includes(selectedJurisdiction) || 
                  rule.jurisdiction === 'Universal' ||
                  rule.jurisdiction === 'IBC 2021' ||
                  (selectedJurisdiction.includes('OH') && rule.jurisdiction.includes('Ohio')) ||
                  (selectedJurisdiction.includes('FL') && rule.jurisdiction.includes('Florida')) ||
                  (selectedJurisdiction.includes('CA') && rule.jurisdiction.includes('California')) ||
                  (selectedJurisdiction.includes('TX') && rule.jurisdiction.includes('Texas')) ||
                  (selectedJurisdiction.includes('NY') && rule.jurisdiction.includes('New York'))
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
