
import { useState, useCallback } from 'react';
import { useOptimizedAI } from '@/hooks/useOptimizedAI';
import { toast } from 'sonner';

export interface DesignSuggestion {
  id: string;
  type: 'optimization' | 'safety' | 'compliance' | 'sustainability' | 'cost';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  estimatedImpact?: string;
  implementation?: {
    difficulty: 'easy' | 'moderate' | 'complex';
    timeframe: string;
    resources: string[];
  };
  references?: string[];
}

export interface ComplianceCheck {
  id: string;
  code: string;
  section: string;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'review-needed' | 'not-applicable';
  notes?: string;
  recommendations?: string[];
}

export interface DesignContext {
  projectType: string;
  buildingType: string;
  location: string;
  jurisdiction: string;
  designElements: string[];
  materials: string[];
  loads?: string[];
  environmentalFactors?: string[];
}

export const useDesignAssistant = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const { optimizedGenerateResponse } = useOptimizedAI();

  const analyzeDesign = useCallback(async (
    designDescription: string,
    context: Partial<DesignContext> = {},
    analysisType: 'comprehensive' | 'safety' | 'compliance' | 'optimization' = 'comprehensive'
  ): Promise<{ suggestions: DesignSuggestion[]; compliance: ComplianceCheck[] }> => {
    if (!designDescription.trim()) {
      toast.error('Design description is required');
      return { suggestions: [], compliance: [] };
    }

    setIsAnalyzing(true);
    try {
      const prompt = buildAnalysisPrompt(designDescription, context, analysisType);
      
      const response = await optimizedGenerateResponse({
        prompt,
        type: 'technical-consulting',
        maxTokens: 3000
      });

      if (response?.result) {
        const { suggestions: newSuggestions, compliance: newCompliance } = parseAnalysisResponse(response.result);
        setSuggestions(newSuggestions);
        setComplianceChecks(newCompliance);
        
        toast.success(`Analysis complete: ${newSuggestions.length} suggestions, ${newCompliance.length} compliance items`);
        return { suggestions: newSuggestions, compliance: newCompliance };
      }
      
      return { suggestions: [], compliance: [] };
    } catch (error) {
      console.error('Design analysis error:', error);
      toast.error('Failed to analyze design');
      return { suggestions: [], compliance: [] };
    } finally {
      setIsAnalyzing(false);
    }
  }, [optimizedGenerateResponse]);

  const getDesignRecommendations = useCallback(async (
    issue: string,
    context: Partial<DesignContext> = {}
  ): Promise<string[]> => {
    try {
      const prompt = `As an expert civil engineer, provide specific, actionable recommendations for this design issue:

Issue: ${issue}

Context:
- Project Type: ${context.projectType || 'Not specified'}
- Building Type: ${context.buildingType || 'Not specified'}
- Location: ${context.location || 'Not specified'}
- Jurisdiction: ${context.jurisdiction || 'Not specified'}

Provide 3-5 specific, actionable recommendations that address this issue while considering current building codes, engineering best practices, and cost-effectiveness.

Format your response as a simple list of recommendations, one per line.`;

      const response = await optimizedGenerateResponse({
        prompt,
        type: 'technical-consulting',
        maxTokens: 1000
      });

      if (response?.result) {
        return response.result.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-*•]\s*/, '').trim())
          .slice(0, 5);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }, [optimizedGenerateResponse]);

  const checkCompliance = useCallback(async (
    designDescription: string,
    jurisdiction: string = 'IBC',
    buildingType: string = 'commercial'
  ): Promise<ComplianceCheck[]> => {
    try {
      const prompt = `Perform a building code compliance check for this design:

Design: ${designDescription}
Jurisdiction: ${jurisdiction}
Building Type: ${buildingType}

Check compliance with relevant building codes including:
- International Building Code (IBC)
- Fire safety codes
- ADA accessibility requirements
- Structural requirements
- Local jurisdiction requirements

For each code section, provide:
1. Code reference (e.g., "IBC Section 1604")
2. Requirement description
3. Compliance status
4. Notes if non-compliant
5. Recommendations if needed

Format as JSON with this structure:
{
  "checks": [
    {
      "code": "IBC",
      "section": "Section number",
      "requirement": "Description",
      "status": "compliant|non-compliant|review-needed|not-applicable",
      "notes": "Additional notes",
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }
  ]
}`;

      const response = await optimizedGenerateResponse({
        prompt,
        type: 'technical-consulting',
        maxTokens: 2000
      });

      if (response?.result) {
        try {
          const parsed = JSON.parse(response.result);
          if (parsed.checks && Array.isArray(parsed.checks)) {
            const checks = parsed.checks.map((check: any, index: number) => ({
              id: `compliance-${Date.now()}-${index}`,
              ...check
            }));
            setComplianceChecks(checks);
            return checks;
          }
        } catch (parseError) {
          // Fallback parsing
          const fallbackChecks = parsePlainTextCompliance(response.result);
          setComplianceChecks(fallbackChecks);
          return fallbackChecks;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Compliance check error:', error);
      toast.error('Failed to check compliance');
      return [];
    }
  }, [optimizedGenerateResponse]);

  const clearResults = useCallback(() => {
    setSuggestions([]);
    setComplianceChecks([]);
  }, []);

  return {
    isAnalyzing,
    suggestions,
    complianceChecks,
    analyzeDesign,
    getDesignRecommendations,
    checkCompliance,
    clearResults
  };
};

// Helper functions
function buildAnalysisPrompt(
  designDescription: string,
  context: Partial<DesignContext>,
  analysisType: string
): string {
  const basePrompt = `You are an expert civil engineering design assistant. Analyze this design and provide structured feedback.

Design Description: ${designDescription}

Context:
- Project Type: ${context.projectType || 'Not specified'}
- Building Type: ${context.buildingType || 'Not specified'}
- Location: ${context.location || 'Not specified'}
- Jurisdiction: ${context.jurisdiction || 'Not specified'}
- Design Elements: ${context.designElements?.join(', ') || 'Not specified'}
- Materials: ${context.materials?.join(', ') || 'Not specified'}

Analysis Type: ${analysisType}

Provide your analysis as JSON with this structure:
{
  "suggestions": [
    {
      "type": "optimization|safety|compliance|sustainability|cost",
      "title": "Brief title",
      "description": "Detailed description",
      "priority": "low|medium|high|critical",
      "confidence": 0.85,
      "estimatedImpact": "Description of expected impact",
      "implementation": {
        "difficulty": "easy|moderate|complex",
        "timeframe": "Timeline estimate",
        "resources": ["Resource 1", "Resource 2"]
      },
      "references": ["Code or standard reference"]
    }
  ],
  "compliance": [
    {
      "code": "IBC",
      "section": "Section reference",
      "requirement": "Requirement description",
      "status": "compliant|non-compliant|review-needed|not-applicable",
      "notes": "Additional notes",
      "recommendations": ["Recommendation if needed"]
    }
  ]
}`;

  switch (analysisType) {
    case 'safety':
      return `${basePrompt}\n\nFocus specifically on safety aspects including structural integrity, fire safety, seismic considerations, and occupant safety.`;
    case 'compliance':
      return `${basePrompt}\n\nFocus specifically on building code compliance, regulatory requirements, and permitting considerations.`;
    case 'optimization':
      return `${basePrompt}\n\nFocus specifically on design optimization including cost reduction, performance improvement, and efficiency gains.`;
    default:
      return basePrompt;
  }
}

function parseAnalysisResponse(response: string): { suggestions: DesignSuggestion[]; compliance: ComplianceCheck[] } {
  try {
    const parsed = JSON.parse(response);
    
    const suggestions = (parsed.suggestions || []).map((suggestion: any, index: number) => ({
      id: `suggestion-${Date.now()}-${index}`,
      ...suggestion
    }));
    
    const compliance = (parsed.compliance || []).map((check: any, index: number) => ({
      id: `compliance-${Date.now()}-${index}`,
      ...check
    }));
    
    return { suggestions, compliance };
  } catch (error) {
    // Fallback parsing for plain text responses
    const suggestions = parseStructuredTextSuggestions(response);
    const compliance = parsePlainTextCompliance(response);
    return { suggestions, compliance };
  }
}

function parseStructuredTextSuggestions(text: string): DesignSuggestion[] {
  const suggestions: DesignSuggestion[] = [];
  const lines = text.split('\n');
  
  let currentSuggestion: Partial<DesignSuggestion> = {};
  
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('recommendation')) {
      if (currentSuggestion.title) {
        suggestions.push({
          id: `suggestion-${Date.now()}-${suggestions.length}`,
          type: 'optimization',
          priority: 'medium',
          confidence: 0.8,
          ...currentSuggestion
        } as DesignSuggestion);
      }
      currentSuggestion = { title: line.trim() };
    } else if (line.trim() && currentSuggestion.title) {
      currentSuggestion.description = (currentSuggestion.description || '') + ' ' + line.trim();
    }
  });
  
  if (currentSuggestion.title) {
    suggestions.push({
      id: `suggestion-${Date.now()}-${suggestions.length}`,
      type: 'optimization',
      priority: 'medium',
      confidence: 0.8,
      ...currentSuggestion
    } as DesignSuggestion);
  }
  
  return suggestions.slice(0, 10); // Limit to 10 suggestions
}

function parsePlainTextCompliance(text: string): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const lines = text.split('\n');
  
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('code') || line.toLowerCase().includes('section')) {
      checks.push({
        id: `compliance-${Date.now()}-${index}`,
        code: 'IBC',
        section: 'General',
        requirement: line.trim(),
        status: 'review-needed'
      });
    }
  });
  
  return checks.slice(0, 5); // Limit to 5 compliance items
}
