
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileSearch,
  Layers,
  Calculator
} from 'lucide-react';
import { ModelValidator, type ValidationResult } from '@/utils/validation/modelValidation';
import { CostValidator } from '@/utils/validation/costValidation';

interface ModelValidationPanelProps {
  uploadId?: string;
}

interface ValidationReport {
  elementValidation: ValidationResult[];
  geometryValidation: ValidationResult[];
  materialValidation: ValidationResult[];
  costValidation: ValidationResult[];
  overallScore: number;
  lastValidated: Date | null;
}

export const ModelValidationPanel: React.FC<ModelValidationPanelProps> = ({ uploadId }) => {
  const [validationReport, setValidationReport] = useState<ValidationReport>({
    elementValidation: [],
    geometryValidation: [],
    materialValidation: [],
    costValidation: [],
    overallScore: 0,
    lastValidated: null
  });

  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState('elements');

  // Mock data for demonstration
  const mockElements = [
    {
      name: 'Wall-001',
      element_type: 'wall',
      geometry: { length: 10, height: 3, thickness: 0.25 },
      material_id: 'concrete-001'
    },
    {
      name: 'Beam-001',
      element_type: 'beam',
      geometry: { length: 20, cross_section_area: 0.5 },
      material_id: 'steel-001'
    },
    {
      name: 'Column-001',
      element_type: 'column',
      geometry: { height: 12, cross_section_area: 1.0 },
      material_id: 'concrete-001'
    }
  ];

  const mockMaterials = [
    {
      name: 'Reinforced Concrete',
      material_type: 'concrete',
      properties: { compressive_strength: 4000, density: 150 }
    },
    {
      name: 'Structural Steel',
      material_type: 'steel',
      properties: { yield_strength: 50000, density: 490 }
    }
  ];

  const runModelValidation = async () => {
    setIsValidating(true);
    
    try {
      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Element validation
      const elementValidation = mockElements.map(element => 
        ModelValidator.validateBIMElement(element)
      );

      // Geometry validation
      const geometryValidation = mockElements.map(element =>
        ModelValidator.validateGeometry(element.geometry, element.element_type)
      );

      // Material validation
      const materialValidation = mockMaterials.map(material =>
        ModelValidator.validateMaterial(material, 'wall')
      );

      // Cost validation (mock)
      const costValidation = [
        {
          isValid: true,
          errors: [],
          warnings: [],
          score: 95
        }
      ];

      // Calculate overall score
      const allValidations = [
        ...elementValidation,
        ...geometryValidation,
        ...materialValidation,
        ...costValidation
      ];
      
      const overallScore = allValidations.reduce((sum, val) => sum + val.score, 0) / allValidations.length;

      setValidationReport({
        elementValidation,
        geometryValidation,
        materialValidation,
        costValidation,
        overallScore: Math.round(overallScore),
        lastValidated: new Date()
      });

    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getValidationSummary = (validations: ValidationResult[]) => {
    const total = validations.length;
    const valid = validations.filter(v => v.isValid).length;
    const invalid = total - valid;
    const avgScore = total > 0 ? validations.reduce((sum, v) => sum + v.score, 0) / total : 0;
    
    return { total, valid, invalid, avgScore: Math.round(avgScore) };
  };

  const renderValidationResults = (validations: ValidationResult[], title: string) => {
    const summary = getValidationSummary(validations);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{summary.valid}</div>
                <div className="text-sm text-muted-foreground">Valid</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{summary.invalid}</div>
                <div className="text-sm text-muted-foreground">Invalid</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${summary.avgScore >= 80 ? 'text-green-500' : summary.avgScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {summary.avgScore}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Score</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          {validations.map((validation, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {validation.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">Item {index + 1}</span>
                  </div>
                  <Badge className={validation.isValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    Score: {validation.score}%
                  </Badge>
                </div>

                {validation.errors.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-red-500 mb-2">Errors:</h4>
                    {validation.errors.map((error, errorIndex) => (
                      <div key={errorIndex} className="text-sm text-red-400 mb-1">
                        • {error.message}
                        {error.suggestion && (
                          <div className="text-xs text-gray-400 ml-2">
                            Suggestion: {error.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-yellow-500 mb-2">Warnings:</h4>
                    {validation.warnings.map((warning, warningIndex) => (
                      <div key={warningIndex} className="text-sm text-yellow-400 mb-1">
                        • {warning.message}
                        <div className="text-xs text-gray-400 ml-2">
                          Suggestion: {warning.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Model Validation Tools
          </h3>
          <p className="text-muted-foreground">
            Comprehensive validation of BIM elements, geometry, materials, and costs
          </p>
        </div>
        <Button 
          onClick={runModelValidation}
          disabled={isValidating}
          className="flex items-center gap-2"
        >
          <FileSearch className="w-4 h-4" />
          {isValidating ? 'Validating...' : 'Run Validation'}
        </Button>
      </div>

      {/* Overall Score */}
      {validationReport.lastValidated && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div>
                <div className={`text-4xl font-bold ${validationReport.overallScore >= 80 ? 'text-green-500' : validationReport.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {validationReport.overallScore}%
                </div>
                <div className="text-sm text-muted-foreground">Overall Model Quality Score</div>
              </div>
              <Progress value={validationReport.overallScore} className="h-3" />
              <div className="text-xs text-muted-foreground">
                Last validated: {validationReport.lastValidated.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="elements" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Elements
          </TabsTrigger>
          <TabsTrigger value="geometry" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Geometry
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            Costs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elements" className="space-y-4">
          {renderValidationResults(validationReport.elementValidation, 'Element Validation')}
        </TabsContent>

        <TabsContent value="geometry" className="space-y-4">
          {renderValidationResults(validationReport.geometryValidation, 'Geometry Validation')}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          {renderValidationResults(validationReport.materialValidation, 'Material Validation')}
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          {renderValidationResults(validationReport.costValidation, 'Cost Validation')}
        </TabsContent>
      </Tabs>
    </div>
  );
};
