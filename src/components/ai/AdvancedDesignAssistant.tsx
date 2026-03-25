
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOptimizedAI } from '@/hooks/useOptimizedAI';
import { 
  Brain, 
  Lightbulb, 
  AlertTriangle, 
  Shield, 
  BookOpen, 
  Zap,
  FileText,
  CheckCircle,
  Upload,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface DesignAnalysis {
  id: string;
  type: 'improvement' | 'issue' | 'compliance' | 'best-practice';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  recommendations: string[];
  references?: string[];
  impact?: string;
  difficulty?: 'easy' | 'moderate' | 'complex';
}

interface ProjectContext {
  projectType: string;
  buildingType: string;
  location: string;
  jurisdiction: string;
  constraints: string[];
  requirements: string[];
}

const ANALYSIS_TYPES = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    description: 'Full design review with all aspects',
    icon: <Brain className="h-4 w-4" />
  },
  {
    id: 'improvements',
    name: 'Design Improvements',
    description: 'Optimization and enhancement suggestions',
    icon: <Lightbulb className="h-4 w-4" />
  },
  {
    id: 'issues',
    name: 'Issue Identification',
    description: 'Potential problems and risks',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  {
    id: 'compliance',
    name: 'Compliance Review',
    description: 'Building code and regulation compliance',
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'best-practices',
    name: 'Best Practices',
    description: 'Industry standards and recommendations',
    icon: <BookOpen className="h-4 w-4" />
  }
];

const BUILDING_TYPES = [
  'Residential - Single Family',
  'Residential - Multi-Family',
  'Commercial - Office',
  'Commercial - Retail',
  'Industrial - Manufacturing',
  'Industrial - Warehouse',
  'Institutional - Healthcare',
  'Institutional - Educational',
  'Infrastructure - Bridge',
  'Infrastructure - Road',
  'Mixed Use'
];

export const AdvancedDesignAssistant: React.FC = () => {
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [designDescription, setDesignDescription] = useState('');
  const [projectContext, setProjectContext] = useState<Partial<ProjectContext>>({});
  const [analyses, setAnalyses] = useState<DesignAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { optimizedGenerateResponse } = useOptimizedAI();

  const buildAnalysisPrompt = (type: string) => {
    const contextInfo = `
Project Context:
- Building Type: ${projectContext.buildingType || 'Not specified'}
- Location: ${projectContext.location || 'Not specified'}
- Jurisdiction: ${projectContext.jurisdiction || 'Not specified'}
- Constraints: ${projectContext.constraints?.join(', ') || 'None specified'}
- Requirements: ${projectContext.requirements?.join(', ') || 'None specified'}

Design Description:
${designDescription}

Files Uploaded: ${uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name).join(', ') : 'None'}
`;

    const basePrompt = `You are an expert civil engineering design assistant with deep knowledge of building codes, structural engineering, architectural design, and construction best practices. Analyze the provided design information and provide structured feedback.

${contextInfo}

Please provide your analysis in the following JSON format:
{
  "analyses": [
    {
      "type": "improvement|issue|compliance|best-practice",
      "title": "Brief title",
      "description": "Detailed description",
      "priority": "low|medium|high|critical",
      "category": "Structural|Architectural|MEP|Code|Safety|Sustainability|Cost",
      "recommendations": ["Specific actionable recommendation 1", "Recommendation 2"],
      "references": ["Code section or standard reference"],
      "impact": "Expected impact description",
      "difficulty": "easy|moderate|complex"
    }
  ]
}`;

    switch (type) {
      case 'improvements':
        return `${basePrompt}

Focus specifically on design improvements and optimizations. Look for:
- Structural efficiency opportunities
- Cost reduction possibilities
- Sustainability enhancements
- Performance optimizations
- Material selection improvements
- Space utilization optimizations`;

      case 'issues':
        return `${basePrompt}

Focus specifically on identifying potential issues and risks. Look for:
- Structural stability concerns
- Safety hazards
- Code violation risks
- Constructability issues
- Maintenance problems
- Environmental concerns`;

      case 'compliance':
        return `${basePrompt}

Focus specifically on building code and regulatory compliance. Review for:
- Building code compliance (IBC, IRC, etc.)
- Fire safety requirements
- ADA accessibility compliance
- Seismic design requirements
- Local zoning compliance
- Environmental regulations`;

      case 'best-practices':
        return `${basePrompt}

Focus specifically on industry best practices and standards. Review for:
- Current industry standards
- Professional engineering practices
- Construction best practices
- Quality assurance standards
- Risk management practices
- Innovation opportunities`;

      default:
        return `${basePrompt}

Provide a comprehensive analysis covering all aspects: design improvements, potential issues, compliance considerations, and best practices recommendations.`;
    }
  };

  const runAnalysis = async () => {
    if (!designDescription.trim()) {
      toast.error('Please provide a design description');
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = buildAnalysisPrompt(analysisType);
      
      const response = await optimizedGenerateResponse({
        prompt,
        type: 'technical-consulting',
        maxTokens: 3000
      });

      if (response?.result) {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(response.result);
          if (parsed.analyses && Array.isArray(parsed.analyses)) {
            const newAnalyses = parsed.analyses.map((analysis: any, index: number) => ({
              id: `analysis-${Date.now()}-${index}`,
              ...analysis
            }));
            setAnalyses(newAnalyses);
          } else {
            throw new Error('Invalid JSON structure');
          }
        } catch (parseError) {
          // Fallback: create a single analysis from the text response
          const fallbackAnalysis: DesignAnalysis = {
            id: `analysis-${Date.now()}`,
            type: analysisType as any,
            title: `${ANALYSIS_TYPES.find(t => t.id === analysisType)?.name} Results`,
            description: response.result,
            priority: 'medium',
            category: 'General',
            recommendations: response.result.split('\n').filter(line => 
              line.includes('recommend') || line.includes('suggest') || line.includes('should')
            ).slice(0, 3),
            impact: 'Detailed analysis provided',
            difficulty: 'moderate'
          };
          setAnalyses([fallbackAnalysis]);
        }
        
        toast.success('Design analysis completed successfully');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to complete design analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <Lightbulb className="h-4 w-4" />;
      case 'issue': return <AlertTriangle className="h-4 w-4" />;
      case 'compliance': return <Shield className="h-4 w-4" />;
      case 'best-practice': return <BookOpen className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) uploaded for analysis`);
  };

  const clearAnalysis = () => {
    setAnalyses([]);
    toast.success('Analysis results cleared');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced AI Design Assistant
          </CardTitle>
          <CardDescription>
            Intelligent design analysis powered by Gemini AI for comprehensive engineering guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">Design Analysis</TabsTrigger>
              <TabsTrigger value="context">Project Context</TabsTrigger>
            </TabsList>

            <TabsContent value="context" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Building Type</label>
                  <Select 
                    value={projectContext.buildingType || ''} 
                    onValueChange={(value) => setProjectContext(prev => ({ ...prev, buildingType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUILDING_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Location/Jurisdiction</label>
                  <Textarea
                    value={projectContext.location || ''}
                    onChange={(e) => setProjectContext(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State, Country and relevant jurisdiction"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Project Constraints</label>
                  <Textarea
                    value={projectContext.constraints?.join('\n') || ''}
                    onChange={(e) => setProjectContext(prev => ({ 
                      ...prev, 
                      constraints: e.target.value.split('\n').filter(c => c.trim()) 
                    }))}
                    placeholder="Budget limitations, site constraints, timeline, etc. (one per line)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Special Requirements</label>
                  <Textarea
                    value={projectContext.requirements?.join('\n') || ''}
                    onChange={(e) => setProjectContext(prev => ({ 
                      ...prev, 
                      requirements: e.target.value.split('\n').filter(r => r.trim()) 
                    }))}
                    placeholder="Seismic requirements, accessibility, sustainability goals, etc. (one per line)"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Analysis Type</label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANALYSIS_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          <div>
                            <div>{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Design Description</label>
                <Textarea
                  value={designDescription}
                  onChange={(e) => setDesignDescription(e.target.value)}
                  placeholder="Provide detailed description of your design including materials, dimensions, structural systems, intended use, and any specific concerns..."
                  rows={6}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Upload Design Files (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.dwg,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-gray-600">Click to upload drawings, images, or documents</span>
                      <span className="text-xs text-muted-foreground">PDF, DWG, PNG, JPG supported</span>
                    </div>
                  </label>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {file.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={runAnalysis}
                  disabled={isAnalyzing || !designDescription.trim()}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Analyzing Design...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
                {analyses.length > 0 && (
                  <Button variant="outline" onClick={clearAnalysis}>
                    Clear Results
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Analysis Results
              </div>
              <Badge variant="outline">{analyses.length} findings</Badge>
            </CardTitle>
            <CardDescription>
              AI-powered design analysis with recommendations and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96" ref={scrollAreaRef}>
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <Card key={analysis.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(analysis.type)}
                          <h4 className="font-semibold">{analysis.title}</h4>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(analysis.priority)}>
                            {analysis.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{analysis.category}</Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {analysis.description}
                      </p>

                      {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <div className="mb-3">
                          <h5 className="font-medium mb-2">Recommendations:</h5>
                          <ul className="text-sm space-y-1">
                            {analysis.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Zap className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Impact: {analysis.impact}</span>
                        <span>Difficulty: {analysis.difficulty}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
