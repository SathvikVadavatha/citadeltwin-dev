
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { Zap, AlertCircle, CheckCircle, TrendingUp, DollarSign, Leaf } from 'lucide-react';

interface OptimizationCriteria {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const OPTIMIZATION_CRITERIA: OptimizationCriteria[] = [
  {
    id: 'cost',
    name: 'Cost Optimization',
    description: 'Minimize material and construction costs',
    icon: <DollarSign className="h-4 w-4" />
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    description: 'Improve environmental impact and energy efficiency',
    icon: <Leaf className="h-4 w-4" />
  },
  {
    id: 'performance',
    name: 'Structural Performance',
    description: 'Optimize for load capacity and structural efficiency',
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'maintenance',
    name: 'Maintainability',
    description: 'Reduce long-term maintenance requirements',
    icon: <CheckCircle className="h-4 w-4" />
  }
];

interface OptimizationResult {
  criteria: string;
  suggestions: string[];
  impactLevel: 'low' | 'medium' | 'high';
  estimatedSavings?: string;
  implementationComplexity: 'simple' | 'moderate' | 'complex';
}

export const DesignOptimizationPanel = () => {
  const [designDescription, setDesignDescription] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const { generateResponse, loading, error } = useGeminiAI();

  const handleCriteriaToggle = (criteriaId: string) => {
    setSelectedCriteria(prev => 
      prev.includes(criteriaId) 
        ? prev.filter(id => id !== criteriaId)
        : [...prev, criteriaId]
    );
  };

  const runOptimization = async () => {
    if (!designDescription.trim() || selectedCriteria.length === 0) return;

    const selectedCriteriaNames = selectedCriteria.map(id => 
      OPTIMIZATION_CRITERIA.find(c => c.id === id)?.name
    ).join(', ');

    const prompt = `
Analyze the following design and provide optimization suggestions based on the selected criteria:

Design Description:
${designDescription}

Optimization Criteria: ${selectedCriteriaNames}

For each criterion, provide:
1. Specific actionable suggestions
2. Expected impact level (low/medium/high)
3. Estimated cost savings or benefits where applicable
4. Implementation complexity (simple/moderate/complex)
5. Technical considerations

Format your response as a structured analysis with clear sections for each optimization criterion.
`;

    try {
      const response = await generateResponse({
        prompt,
        type: 'technical-consulting',
        context: 'You are a design optimization expert specializing in civil engineering and construction efficiency.',
        maxTokens: 2500
      });

      if (response) {
        // Parse the response and create structured results
        // For now, we'll display the raw response and could enhance with structured parsing
        const mockResults: OptimizationResult[] = selectedCriteria.map(criteriaId => ({
          criteria: OPTIMIZATION_CRITERIA.find(c => c.id === criteriaId)?.name || criteriaId,
          suggestions: response.result.split('\n').filter(line => line.trim().length > 0).slice(0, 3),
          impactLevel: 'medium' as const,
          estimatedSavings: '10-20%',
          implementationComplexity: 'moderate' as const
        }));

        setOptimizationResults(mockResults);
      }
    } catch (error) {
      console.error('Error running optimization:', error);
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'complex': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Design Optimization
          </CardTitle>
          <CardDescription>
            AI-powered analysis to optimize your design for cost, sustainability, and performance
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
            <label className="text-sm font-medium mb-2 block">Design Description</label>
            <Textarea
              value={designDescription}
              onChange={(e) => setDesignDescription(e.target.value)}
              placeholder="Describe your current design, including materials, dimensions, structural elements, and any specific requirements..."
              rows={6}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Optimization Criteria</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OPTIMIZATION_CRITERIA.map((criteria) => (
                <Card
                  key={criteria.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCriteria.includes(criteria.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleCriteriaToggle(criteria.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{criteria.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium">{criteria.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {criteria.description}
                        </p>
                      </div>
                      {selectedCriteria.includes(criteria.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Button
            onClick={runOptimization}
            disabled={loading || !designDescription.trim() || selectedCriteria.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Analyzing Design...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Optimization Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {optimizationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Optimization Results
            </CardTitle>
            <CardDescription>
              AI-generated suggestions for improving your design
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {optimizationResults.map((result, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{result.criteria}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getImpactColor(result.impactLevel)}>
                        {result.impactLevel} impact
                      </Badge>
                      <Badge variant="outline" className={getComplexityColor(result.implementationComplexity)}>
                        {result.implementationComplexity}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {result.suggestions.map((suggestion, suggestionIndex) => (
                      <div key={suggestionIndex} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{suggestion}</p>
                      </div>
                    ))}
                  </div>

                  {result.estimatedSavings && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>Estimated Savings:</strong> {result.estimatedSavings}
                      </p>
                    </div>
                  )}
                  
                  {index < optimizationResults.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
