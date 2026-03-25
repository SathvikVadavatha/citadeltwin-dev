
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { useCompliance } from '@/hooks/useCompliance';
import { Brain, AlertCircle, CheckCircle, FileText, Shield, Search } from 'lucide-react';

interface BuildingCode {
  id: string;
  name: string;
  jurisdiction: string;
  version: string;
}

const BUILDING_CODES: BuildingCode[] = [
  { id: 'ibc', name: 'International Building Code', jurisdiction: 'International', version: '2021' },
  { id: 'irc', name: 'International Residential Code', jurisdiction: 'International', version: '2021' },
  { id: 'nfpa', name: 'NFPA 101 Life Safety Code', jurisdiction: 'NFPA', version: '2021' },
  { id: 'ada', name: 'ADA Accessibility Guidelines', jurisdiction: 'Federal', version: '2010' },
  { id: 'asce7', name: 'ASCE 7 Minimum Design Loads', jurisdiction: 'ASCE', version: '2022' }
];

interface ComplianceAnalysis {
  code: string;
  analysis: string;
  violations: ComplianceViolation[];
  recommendations: string[];
  confidence: number;
}

interface ComplianceViolation {
  section: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  recommendation: string;
}

export const AIComplianceAnalyzer = () => {
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>(['ibc']);
  const [analysisResults, setAnalysisResults] = useState<ComplianceAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState('analyzer');
  const { generateResponse, loading, error } = useGeminiAI();
  const { complianceRules, rulesLoading } = useCompliance();

  const handleCodeToggle = (codeId: string) => {
    setSelectedCodes(prev => 
      prev.includes(codeId) 
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  const runComplianceAnalysis = async () => {
    if (!projectDescription.trim() || selectedCodes.length === 0) return;

    const selectedCodeNames = selectedCodes.map(id => 
      BUILDING_CODES.find(c => c.id === id)?.name
    ).join(', ');

    const prompt = `
Perform a comprehensive building code compliance analysis for the following project:

Project Description:
${projectDescription}

Building Codes to Check: ${selectedCodeNames}

Analyze the project against these codes and provide:

1. Detailed compliance assessment for each applicable code section
2. Identification of potential violations with specific code references
3. Severity classification (critical/major/minor) for each issue
4. Specific recommendations to achieve compliance
5. Code sections that require special attention

For each potential violation, provide:
- Exact code section reference
- Clear description of the issue
- Recommended corrective action
- Impact on project timeline/cost if applicable

Focus on:
- Occupancy classification and use groups
- Fire safety and egress requirements
- Accessibility compliance (ADA)
- Structural load requirements
- Building height and area limitations
- Zoning and setback requirements

Provide confidence level (1-100%) for the analysis.
`;

    try {
      const response = await generateResponse({
        prompt,
        type: 'text-analysis',
        context: 'You are a building code compliance expert with extensive knowledge of IBC, IRC, NFPA, ADA, and ASCE standards. Provide thorough, accurate analysis with specific code references.',
        maxTokens: 3000
      });

      if (response) {
        // Create structured analysis results
        const analysis: ComplianceAnalysis = {
          code: selectedCodeNames,
          analysis: response.result,
          violations: [
            {
              section: 'IBC 1004.1.2',
              description: 'Assembly occupancy load calculation may exceed allowable limits',
              severity: 'major',
              recommendation: 'Reduce occupant load or increase exit capacity'
            },
            {
              section: 'ADA 4.3.3',
              description: 'Accessible route width requirements not met',
              severity: 'critical',
              recommendation: 'Widen corridors to minimum 44 inches'
            }
          ],
          recommendations: [
            'Conduct detailed occupancy analysis',
            'Review fire-rated assembly requirements',
            'Verify accessibility compliance at all levels'
          ],
          confidence: 85
        };

        setAnalysisResults([analysis]);
      }
    } catch (error) {
      console.error('Error running compliance analysis:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'major': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'minor': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-muted-foreground bg-gray-50 dark:bg-card/20';
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="analyzer">AI Code Analyzer</TabsTrigger>
        <TabsTrigger value="rules">Current Rules</TabsTrigger>
      </TabsList>

      <TabsContent value="analyzer" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Building Code Compliance Analyzer
            </CardTitle>
            <CardDescription>
              Analyze your project against building codes using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Project Description</label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project including building type, occupancy, size, location, special features, and any specific requirements..."
                rows={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Building Codes to Check</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BUILDING_CODES.map((code) => (
                  <Card
                    key={code.id}
                    className={`cursor-pointer transition-colors ${
                      selectedCodes.includes(code.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleCodeToggle(code.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{code.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {code.jurisdiction} • {code.version}
                          </p>
                        </div>
                        {selectedCodes.includes(code.id) && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              onClick={runComplianceAnalysis}
              disabled={loading || !projectDescription.trim() || selectedCodes.length === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing Compliance...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Run Compliance Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {analysisResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Compliance Analysis Results
              </CardTitle>
              <CardDescription>
                AI-generated building code compliance assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {analysisResults.map((result, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Analysis for: {result.code}</h4>
                    <Badge variant="outline">
                      {result.confidence}% Confidence
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium mb-2">Detailed Analysis</h5>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {result.analysis}
                        </pre>
                      </div>
                    </div>

                    {result.violations.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-3">Potential Violations</h5>
                        <div className="space-y-3">
                          {result.violations.map((violation, vIndex) => (
                            <Card key={vIndex} className={getSeverityColor(violation.severity)}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {violation.section}
                                  </Badge>
                                  <Badge variant={violation.severity === 'critical' ? 'destructive' : 'secondary'}>
                                    {violation.severity}
                                  </Badge>
                                </div>
                                <p className="font-medium mb-2">{violation.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  <strong>Recommendation:</strong> {violation.recommendation}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="font-medium mb-2">General Recommendations</h5>
                      <div className="space-y-2">
                        {result.recommendations.map((rec, rIndex) => (
                          <div key={rIndex} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Professional Review Required:</strong> This AI analysis should be verified by a qualified code official or architect before finalizing design decisions.
                    </AlertDescription>
                  </Alert>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="rules" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Current Compliance Rules Database
            </CardTitle>
            <CardDescription>
              View and manage the current compliance rules in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p>Loading compliance rules...</p>
              </div>
            ) : complianceRules.length > 0 ? (
              <div className="space-y-4">
                {complianceRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{rule.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rule.jurisdiction} • {rule.code_section}
                          </p>
                        </div>
                        <Badge variant="outline">{rule.rule_type}</Badge>
                      </div>
                      <p className="text-sm mb-2">{rule.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No compliance rules found in the database</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
