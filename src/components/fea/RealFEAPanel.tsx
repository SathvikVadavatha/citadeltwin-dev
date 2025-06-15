
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Settings, Play, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { useRealFEA } from '@/hooks/useRealFEA';
import { useBIMElements } from '@/hooks/useBIMElements';
import { useMaterials } from '@/hooks/useMaterials';

interface FEAParameters {
  elementId: string;
  materialId: string;
  analysisType: 'static' | 'modal' | 'buckling';
  meshSize: number;
  forces: any[];
  constraints: any[];
  numberOfModes?: number;
}

interface MaterialProperties {
  youngs_modulus?: number;
  poissons_ratio?: number;
  density?: number;
}

export const RealFEAPanel = () => {
  const { elements } = useBIMElements();
  const { materials } = useMaterials();
  const {
    runStaticAnalysis,
    runModalAnalysis,
    runBucklingAnalysis,
    generateMesh,
    validateModel,
    analysisStatus,
    isRunningAnalysis,
    isGeneratingMesh,
    isValidating
  } = useRealFEA();

  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  const [parameters, setParameters] = useState<FEAParameters>({
    elementId: '',
    materialId: '',
    analysisType: 'static',
    meshSize: 0.1,
    forces: [],
    constraints: [],
    numberOfModes: 10
  });
  const [validationResults, setValidationResults] = useState<any>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{ [key: string]: number }>({});

  const handleRunAnalysis = async () => {
    if (!selectedAnalysisId || !parameters.elementId) return;

    try {
      const selectedMaterial = materials.find(m => m.id === parameters.materialId);
      let materialProperties;
      
      if (selectedMaterial && selectedMaterial.properties) {
        // Type assertion for JSONB properties
        const props = selectedMaterial.properties as MaterialProperties;
        materialProperties = {
          youngsModulus: props.youngs_modulus || 200000000000,
          poissonsRatio: props.poissons_ratio || 0.3,
          density: props.density || 7850
        };
      }

      const analysisParams = {
        analysisId: selectedAnalysisId,
        elementId: parameters.elementId,
        analysisType: parameters.analysisType,
        materialProperties,
        forces: parameters.forces,
        constraints: parameters.constraints
      };

      switch (parameters.analysisType) {
        case 'static':
          await runStaticAnalysis(analysisParams);
          break;
        case 'modal':
          await runModalAnalysis({
            ...analysisParams,
            numberOfModes: parameters.numberOfModes
          });
          break;
        case 'buckling':
          await runBucklingAnalysis({
            ...analysisParams,
            loads: parameters.forces
          });
          break;
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    }
  };

  const handleGenerateMesh = async () => {
    if (!selectedAnalysisId || !parameters.elementId) return;

    try {
      await generateMesh({
        analysisId: selectedAnalysisId,
        elementId: parameters.elementId,
        meshSize: parameters.meshSize
      });
    } catch (error) {
      console.error('Error generating mesh:', error);
    }
  };

  const handleValidateModel = async () => {
    if (!selectedAnalysisId) return;

    try {
      const results = await validateModel(selectedAnalysisId);
      setValidationResults(results.validation);
    } catch (error) {
      console.error('Error validating model:', error);
    }
  };

  const addForce = () => {
    setParameters(prev => ({
      ...prev,
      forces: [...prev.forces, {
        nodeSet: 'NALL',
        direction: 3,
        magnitude: 1000
      }]
    }));
  };

  const addConstraint = () => {
    setParameters(prev => ({
      ...prev,
      constraints: [...prev.constraints, {
        nodeSet: 'NALL',
        dof: '1,6'
      }]
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-500" />
            Real FEA Integration (CalculiX)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="mesh">Mesh</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Analysis ID</Label>
                  <Input
                    value={selectedAnalysisId}
                    onChange={(e) => setSelectedAnalysisId(e.target.value)}
                    placeholder="Enter analysis ID"
                    className="cyber-button"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Element</Label>
                  <Select
                    value={parameters.elementId}
                    onValueChange={(value) => setParameters(prev => ({ ...prev, elementId: value }))}
                  >
                    <SelectTrigger className="cyber-button">
                      <SelectValue placeholder="Select element" />
                    </SelectTrigger>
                    <SelectContent>
                      {elements.map(element => (
                        <SelectItem key={element.id} value={element.id}>
                          {element.name} ({element.element_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select
                    value={parameters.materialId}
                    onValueChange={(value) => setParameters(prev => ({ ...prev, materialId: value }))}
                  >
                    <SelectTrigger className="cyber-button">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(material => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.material_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Analysis Type</Label>
                  <Select
                    value={parameters.analysisType}
                    onValueChange={(value: any) => setParameters(prev => ({ ...prev, analysisType: value }))}
                  >
                    <SelectTrigger className="cyber-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Static Analysis</SelectItem>
                      <SelectItem value="modal">Modal Analysis</SelectItem>
                      <SelectItem value="buckling">Buckling Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {parameters.analysisType === 'modal' && (
                <div className="space-y-2">
                  <Label>Number of Modes</Label>
                  <Input
                    type="number"
                    value={parameters.numberOfModes}
                    onChange={(e) => setParameters(prev => ({ ...prev, numberOfModes: Number(e.target.value) }))}
                    className="cyber-button"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Forces</Label>
                    <Button onClick={addForce} size="sm" className="cyber-button">
                      Add Force
                    </Button>
                  </div>
                  {parameters.forces.map((force, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 p-2 border rounded">
                      <Input placeholder="Node Set" className="cyber-button" />
                      <Input type="number" placeholder="Direction" className="cyber-button" />
                      <Input type="number" placeholder="Magnitude" className="cyber-button" />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Constraints</Label>
                    <Button onClick={addConstraint} size="sm" className="cyber-button">
                      Add Constraint
                    </Button>
                  </div>
                  {parameters.constraints.map((constraint, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded">
                      <Input placeholder="Node Set" className="cyber-button" />
                      <Input placeholder="DOF (e.g., 1,6)" className="cyber-button" />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mesh" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mesh Generation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mesh Size</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={parameters.meshSize}
                      onChange={(e) => setParameters(prev => ({ ...prev, meshSize: Number(e.target.value) }))}
                      className="cyber-button"
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateMesh}
                    disabled={!selectedAnalysisId || !parameters.elementId || isGeneratingMesh}
                    className="cyber-button w-full"
                  >
                    {isGeneratingMesh ? 'Generating Mesh...' : 'Generate Mesh'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Model Validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleValidateModel}
                    disabled={!selectedAnalysisId || isValidating}
                    className="cyber-button w-full"
                  >
                    {isValidating ? 'Validating...' : 'Validate Model'}
                  </Button>
                  
                  {validationResults && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {validationResults.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        <span>
                          {validationResults.isValid ? 'Model is valid' : 'Model has issues'}
                        </span>
                      </div>
                      
                      {validationResults.errors.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-red-500">Errors:</h5>
                          <ul className="list-disc list-inside text-sm">
                            {validationResults.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validationResults.warnings.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-yellow-500">Warnings:</h5>
                          <ul className="list-disc list-inside text-sm">
                            {validationResults.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Run Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleRunAnalysis}
                    disabled={!selectedAnalysisId || !parameters.elementId || isRunningAnalysis}
                    className="cyber-button w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isRunningAnalysis ? 'Running Analysis...' : `Run ${parameters.analysisType} Analysis`}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Analysis Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisStatus.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No running analyses
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {analysisStatus.map((analysis: any) => (
                        <div key={analysis.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{analysis.id}</span>
                            <Badge 
                              variant={analysis.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {analysis.status}
                            </Badge>
                          </div>
                          {analysis.status === 'running' && (
                            <Progress 
                              value={analysisProgress[analysis.id] || 0} 
                              className="w-full"
                            />
                          )}
                          <div className="text-sm text-muted-foreground mt-2">
                            Started: {new Date(analysis.started_at).toLocaleString()}
                            {analysis.completed_at && (
                              <> • Completed: {new Date(analysis.completed_at).toLocaleString()}</>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
