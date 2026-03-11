
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Download, Eye, Settings, CheckCircle, Edit2, RotateCcw } from 'lucide-react';
import { useDocumentExports } from '@/hooks/useDocumentExports';
import { useGeminiAI } from '@/hooks/useGeminiAI';

interface AdvancedDocumentGeneratorProps {
  uploadId?: string;
  selectedJurisdiction?: string;
}

interface ExtendedDocumentExport {
  id: string;
  title: string;
  document_type: string;
  format_type: string;
  status: string;
  error_message?: string;
  template_id?: string;
  generated_at: string;
  ai_generated_content?: any;
}

export const AdvancedDocumentGenerator: React.FC<AdvancedDocumentGeneratorProps> = ({
  uploadId,
  selectedJurisdiction
}) => {
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [clientRequirements, setClientRequirements] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const [aiPreviewContent, setAiPreviewContent] = useState({
    narrative: '',
    compliance: '',
    executiveSummary: ''
  });
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [aiOptimizations, setAiOptimizations] = useState({
    enhanceNarrative: true,
    optimizeCompliance: true,
    generateExecutiveSummary: true,
    createVisualElements: true
  });

  const { generateDocument, exports } = useDocumentExports(uploadId);
  const { generateContent } = useGeminiAI();

  const documentTypes = [
    {
      id: 'permit_package',
      name: 'Complete Permit Package',
      description: 'Comprehensive permit application with all required documentation',
      aiFeatures: ['Auto-generated project narrative', 'Compliance verification', 'Code analysis'],
      estimatedTime: '5-8 minutes'
    },
    {
      id: 'structural_report',
      name: 'Professional Structural Report',
      description: 'Detailed structural analysis with calculations and recommendations',
      aiFeatures: ['Automated calculations', 'Load analysis', 'Safety recommendations'],
      estimatedTime: '8-12 minutes'
    },
    {
      id: 'client_presentation',
      name: 'Client Presentation Package',
      description: 'Professional presentation with executive summary and visualizations',
      aiFeatures: ['Executive summary', 'Visual optimization', 'Client customization'],
      estimatedTime: '3-5 minutes'
    },
    {
      id: 'compliance_report',
      name: 'Compliance Assessment Report',
      description: 'Comprehensive compliance analysis with jurisdiction-specific requirements',
      aiFeatures: ['Jurisdiction analysis', 'Risk assessment', 'Remediation suggestions'],
      estimatedTime: '6-10 minutes'
    }
  ];

  // Step 1: Run AI calls and populate the preview state
  const handleGenerateAIContent = async () => {
    if (!selectedTemplateType || !documentTitle) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setIsPreviewReady(false);

    try {
      let narrative = '';
      let compliance = '';
      let executiveSummary = '';

      if (aiOptimizations.enhanceNarrative) {
        setGenerationProgress(20);
        const result = await generateContent.mutateAsync({
          prompt: `Generate a professional project narrative for: ${projectDescription}. Include technical details, scope, and objectives for a ${selectedTemplateType}.`,
          type: 'technical-consulting'
        });
        narrative = result.result;
      }

      if (aiOptimizations.optimizeCompliance && selectedJurisdiction) {
        setGenerationProgress(50);
        const result = await generateContent.mutateAsync({
          prompt: `Analyze compliance requirements for jurisdiction ${selectedJurisdiction} for project: ${projectDescription}. Focus on ${selectedTemplateType} requirements.`,
          type: 'technical-consulting'
        });
        compliance = result.result;
      }

      if (aiOptimizations.generateExecutiveSummary) {
        setGenerationProgress(80);
        const result = await generateContent.mutateAsync({
          prompt: `Create an executive summary for ${documentTitle}. Project: ${projectDescription}. Client requirements: ${clientRequirements}`,
          type: 'technical-consulting'
        });
        executiveSummary = result.result;
      }

      setGenerationProgress(100);
      setAiPreviewContent({ narrative, compliance, executiveSummary });
      setIsPreviewReady(true);
      setActiveTab('preview');

    } catch (error) {
      console.error('AI content generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Step 2: Export the (possibly edited) AI content as a document
  const handleFinalExport = async () => {
    await generateDocument.mutateAsync({
      templateId: selectedTemplateType,
      uploadId,
      documentType: selectedTemplateType,
      title: documentTitle,
      formatType: 'pdf',
      generationData: {
        project_name: documentTitle,
        project_description: projectDescription,
        client_requirements: clientRequirements,
        ai_enhanced_narrative: aiPreviewContent.narrative,
        ai_compliance_analysis: aiPreviewContent.compliance,
        ai_executive_summary: aiPreviewContent.executiveSummary,
        jurisdiction: selectedJurisdiction,
        ai_optimizations: aiOptimizations,
        generation_timestamp: new Date().toISOString()
      }
    });
  };

  const handleResetPreview = () => {
    setIsPreviewReady(false);
    setAiPreviewContent({ narrative: '', compliance: '', executiveSummary: '' });
    setActiveTab('generate');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            Advanced Document Generator
          </CardTitle>
          <CardDescription>
            AI-powered document generation with sophisticated templates and optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="optimization">AI Optimization</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="preview" disabled={!isPreviewReady}>
                Preview & Edit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <div>
                <Label>Document Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {documentTypes.map((type) => (
                    <Card
                      key={type.id}
                      className={`cursor-pointer transition-colors ${
                        selectedTemplateType === type.id
                          ? 'border-cyan-500 bg-cyan-900/20'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedTemplateType(type.id)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">{type.name}</h4>
                        <p className="text-sm text-gray-400 mb-3">{type.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-cyan-400" />
                            <span className="text-xs">AI Features:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {type.aiFeatures.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Est. time: {type.estimatedTime}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Enter document title"
                />
              </div>
              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Detailed project description..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="requirements">Client Requirements</Label>
                <Textarea
                  id="requirements"
                  value={clientRequirements}
                  onChange={(e) => setClientRequirements(e.target.value)}
                  placeholder="Specific client requirements and preferences..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">AI Optimization Settings</h4>
                <div className="space-y-3">
                  {Object.entries(aiOptimizations).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-gray-400">
                          {key === 'enhanceNarrative' && 'AI-enhanced project descriptions and technical narratives'}
                          {key === 'optimizeCompliance' && 'Automated compliance analysis and code verification'}
                          {key === 'generateExecutiveSummary' && 'AI-generated executive summaries and abstracts'}
                          {key === 'createVisualElements' && 'Optimized charts, diagrams, and visual presentations'}
                        </p>
                      </div>
                      <Button
                        variant={enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAiOptimizations(prev => ({ ...prev, [key]: !enabled }))}
                      >
                        {enabled ? <CheckCircle className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium mb-2">Generate AI Content</h4>
                <p className="text-sm text-gray-400 mb-4">
                  {selectedTemplateType && documentTitle
                    ? `AI will draft content for: ${documentTypes.find(t => t.id === selectedTemplateType)?.name} — "${documentTitle}"`
                    : 'Please complete setup and content tabs first'
                  }
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  You will be able to review and edit the AI output before the document is exported.
                </p>

                {isGenerating && (
                  <div className="mb-4">
                    <Progress value={generationProgress} className="mb-2" />
                    <p className="text-sm text-gray-400">
                      Generating AI content... {generationProgress}%
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleGenerateAIContent}
                  disabled={!selectedTemplateType || !documentTitle || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating AI Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Content
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">Review & Edit AI Output</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Edit the sections below before exporting the final document.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetPreview}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>

              {aiOptimizations.enhanceNarrative && (
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Edit2 className="h-3 w-3 text-cyan-400" />
                    Project Narrative
                  </Label>
                  <Textarea
                    value={aiPreviewContent.narrative}
                    onChange={(e) => setAiPreviewContent(prev => ({ ...prev, narrative: e.target.value }))}
                    rows={6}
                    className="text-sm"
                    placeholder="AI-generated project narrative will appear here..."
                  />
                </div>
              )}

              {aiOptimizations.optimizeCompliance && selectedJurisdiction && (
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Edit2 className="h-3 w-3 text-cyan-400" />
                    Compliance Analysis
                  </Label>
                  <Textarea
                    value={aiPreviewContent.compliance}
                    onChange={(e) => setAiPreviewContent(prev => ({ ...prev, compliance: e.target.value }))}
                    rows={6}
                    className="text-sm"
                    placeholder="AI-generated compliance analysis will appear here..."
                  />
                </div>
              )}

              {aiOptimizations.generateExecutiveSummary && (
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Edit2 className="h-3 w-3 text-cyan-400" />
                    Executive Summary
                  </Label>
                  <Textarea
                    value={aiPreviewContent.executiveSummary}
                    onChange={(e) => setAiPreviewContent(prev => ({ ...prev, executiveSummary: e.target.value }))}
                    rows={5}
                    className="text-sm"
                    placeholder="AI-generated executive summary will appear here..."
                  />
                </div>
              )}

              <Button
                onClick={handleFinalExport}
                disabled={generateDocument.isPending}
                className="w-full"
                size="lg"
              >
                {generateDocument.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Exporting Document...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Confirm & Export Document
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generated Documents */}
      {exports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exports.slice(0, 5).map((exportItem) => (
                <div key={exportItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">{exportItem.title}</h4>
                      <p className="text-sm text-gray-400">
                        {exportItem.document_type} • {exportItem.format_type.toUpperCase()} •{' '}
                        {new Date(exportItem.generated_at).toLocaleDateString()}
                      </p>
                      {(exportItem as ExtendedDocumentExport).ai_generated_content && (
                        <Badge className="mt-1">AI Enhanced</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
