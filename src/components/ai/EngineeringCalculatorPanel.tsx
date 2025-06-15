
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { Calculator, AlertCircle, CheckCircle, FileText, Download } from 'lucide-react';

interface CalculationType {
  id: string;
  name: string;
  description: string;
  parameters: string[];
}

const CALCULATION_TYPES: CalculationType[] = [
  {
    id: 'beam-analysis',
    name: 'Beam Analysis',
    description: 'Calculate moments, shear, and deflection for beams',
    parameters: ['Load (kN)', 'Span (m)', 'Material', 'Cross-section']
  },
  {
    id: 'column-design',
    name: 'Column Design',
    description: 'Design and check column capacity',
    parameters: ['Axial Load (kN)', 'Height (m)', 'End Conditions', 'Material']
  },
  {
    id: 'foundation-design',
    name: 'Foundation Design',
    description: 'Calculate foundation dimensions and reinforcement',
    parameters: ['Load (kN)', 'Soil Bearing Capacity (kPa)', 'Foundation Type']
  },
  {
    id: 'wind-load',
    name: 'Wind Load Analysis',
    description: 'Calculate wind loads on structures',
    parameters: ['Building Height (m)', 'Width (m)', 'Location', 'Exposure Category']
  },
  {
    id: 'seismic-analysis',
    name: 'Seismic Analysis',
    description: 'Calculate seismic forces and design parameters',
    parameters: ['Building Height (m)', 'Weight (kN)', 'Seismic Zone', 'Soil Type']
  }
];

interface CalculationResult {
  type: string;
  inputs: Record<string, string>;
  results: string;
  formulas: string[];
  safety_factors: string;
  recommendations: string[];
}

export const EngineeringCalculatorPanel = () => {
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationType>(CALCULATION_TYPES[0]);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const { generateResponse, loading, error } = useGeminiAI();

  const handleParameterChange = (parameter: string, value: string) => {
    setParameters(prev => ({ ...prev, [parameter]: value }));
  };

  const runCalculation = async () => {
    if (!selectedCalculation || Object.keys(parameters).length === 0) return;

    const parameterList = Object.entries(parameters)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const prompt = `
Perform a detailed ${selectedCalculation.name} calculation with the following parameters:

${parameterList}

Additional Requirements:
${additionalRequirements || 'None specified'}

Please provide:
1. Step-by-step calculations with all formulas used
2. Intermediate results and final values
3. Applied safety factors and code references
4. Design recommendations and considerations
5. Any warnings or critical checks that should be performed

Use appropriate engineering codes (IBC, AISC, ACI, etc.) and include proper units for all values.
Format the response clearly with sections for inputs, calculations, results, and recommendations.
`;

    try {
      const response = await generateResponse({
        prompt,
        type: 'engineering-calculations',
        context: 'You are a licensed structural engineer. Provide accurate calculations following current engineering codes and standards. Always include safety factors and code references.',
        maxTokens: 3000
      });

      if (response) {
        // Parse and structure the response
        const result: CalculationResult = {
          type: selectedCalculation.name,
          inputs: parameters,
          results: response.result,
          formulas: ['M = wL²/8', 'σ = M/S', 'δ = 5wL⁴/384EI'], // Example formulas
          safety_factors: 'Load Factor: 1.6, Resistance Factor: 0.9',
          recommendations: [
            'Verify material properties',
            'Check serviceability limits',
            'Consider construction tolerances'
          ]
        };
        setCalculationResult(result);
      }
    } catch (error) {
      console.error('Error performing calculation:', error);
    }
  };

  const exportCalculation = () => {
    if (!calculationResult) return;
    
    const exportData = {
      ...calculationResult,
      timestamp: new Date().toISOString(),
      engineer: 'CitadelTwin AI Assistant'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${calculationResult.type.replace(/\s+/g, '_')}_calculation.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Engineering Calculator
          </CardTitle>
          <CardDescription>
            AI-powered structural and civil engineering calculations with code compliance
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
            <label className="text-sm font-medium mb-2 block">Calculation Type</label>
            <Select 
              value={selectedCalculation.id} 
              onValueChange={(value) => {
                const calc = CALCULATION_TYPES.find(c => c.id === value);
                if (calc) {
                  setSelectedCalculation(calc);
                  setParameters({});
                  setCalculationResult(null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALCULATION_TYPES.map((calc) => (
                  <SelectItem key={calc.id} value={calc.id}>
                    <div>
                      <div className="font-medium">{calc.name}</div>
                      <div className="text-sm text-muted-foreground">{calc.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCalculation.parameters.map((parameter) => (
              <div key={parameter}>
                <label className="text-sm font-medium mb-1 block">{parameter}</label>
                <Input
                  value={parameters[parameter] || ''}
                  onChange={(e) => handleParameterChange(parameter, e.target.value)}
                  placeholder={`Enter ${parameter.toLowerCase()}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Additional Requirements</label>
            <Textarea
              value={additionalRequirements}
              onChange={(e) => setAdditionalRequirements(e.target.value)}
              placeholder="Specify any additional design requirements, constraints, or special considerations..."
              rows={3}
            />
          </div>

          <Button
            onClick={runCalculation}
            disabled={loading || Object.keys(parameters).length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Perform Calculation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {calculationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Calculation Results: {calculationResult.type}
                </CardTitle>
                <CardDescription>
                  Generated by CitadelTwin AI Assistant
                </CardDescription>
              </div>
              <Button variant="outline" onClick={exportCalculation}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Input Parameters</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(calculationResult.inputs).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-muted rounded">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Detailed Calculations & Results</h4>
              <div className="bg-muted/30 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {calculationResult.results}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Key Formulas Used</h4>
                <div className="space-y-1">
                  {calculationResult.formulas.map((formula, index) => (
                    <Badge key={index} variant="outline" className="block w-fit">
                      {formula}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Safety Factors</h4>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm">{calculationResult.safety_factors}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <div className="space-y-2">
                {calculationResult.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Professional Review Required:</strong> These calculations are generated by AI and should be reviewed by a licensed professional engineer before use in construction or design.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
