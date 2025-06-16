
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  Play, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useRealFEA } from '@/hooks/useRealFEA';
import { useFEAAnalyses } from '@/hooks/useFEAAnalyses';
import { useBIMElements } from '@/hooks/useBIMElements';

export const RealFEAPanel = () => {
  const [selectedElementId, setSelectedElementId] = useState('');
  const [analysisType, setAnalysisType] = useState<'static' | 'modal' | 'buckling'>('static');
  const [numberOfModes, setNumberOfModes] = useState(10);
  const [meshSize, setMeshSize] = useState(0.1);
  
  const { elements } = useBIMElements();
  const { createAnalysis } = useFEAAnalyses();
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

  const handleRunAnalysis = async () => {
    if (!selectedElementId) return;

    try {
      // Create analysis record
      const analysis = await createAnalysis({
        name: `${analysisType} Analysis - ${new Date().toLocaleDateString()}`,
        description: `Real FEA ${analysisType} analysis`,
        analysis_type: analysisType,
        element_id: selectedElementId,
        input_parameters: {
          meshSize,
          numberOfModes: analysisType === 'modal' ? numberOfModes : undefined
        }
      });

      if (!analysis) return;

      // Generate mesh first
      await generateMesh({
        analysisId: analysis.id,
        elementId: selectedElementId,
        meshSize
      });

      // Validate model
      await validateModel(analysis.id);

      // Run appropriate analysis
      const analysisParams = {
        analysisId: analysis.id,
        elementId: selectedElementId,
        analysisType,
        numberOfModes: analysisType === 'modal' ? numberOfModes : undefined
      };

      switch (analysisType) {
        case 'static':
          await runStaticAnalysis(analysisParams);
          break;
        case 'modal':
          await runModalAnalysis(analysisParams);
          break;
        case 'buckling':
          await runBucklingAnalysis(analysisParams);
          break;
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    }
  };

  return (
    <Card className="gradient-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-500" />
          Real FEA Analysis Engine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="mesh">Mesh</TabsTrigger>
            <TabsTrigger value="run">Run Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="element-select">Select BIM Element</Label>
                <Select value={selectedElementId} onValueChange={setSelectedElementId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an element..." />
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

              <div>
                <Label htmlFor="analysis-type">Analysis Type</Label>
                <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static Analysis</SelectItem>
                    <SelectItem value="modal">Modal Analysis</SelectItem>
                    <SelectItem value="buckling">Buckling Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {analysisType === 'modal' && (
                <div>
                  <Label htmlFor="modes">Number of Modes</Label>
                  <Input
                    id="modes"
                    type="number"
                    value={numberOfModes}
                    onChange={(e) => setNumberOfModes(parseInt(e.target.value))}
                    min={1}
                    max={50}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="mesh-size">Mesh Size</Label>
                <Input
                  id="mesh-size"
                  type="number"
                  value={meshSize}
                  onChange={(e) => setMeshSize(parseFloat(e.target.value))}
                  min={0.01}
                  max={1}
                  step={0.01}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mesh" className="space-y-4">
            {selectedElementId ? (
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Mesh will be automatically generated when you run the analysis.
                    Current mesh size: {meshSize}
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={() => generateMesh({
                    analysisId: 'preview',
                    elementId: selectedElementId,
                    meshSize
                  })}
                  disabled={isGeneratingMesh}
                  className="cyber-button"
                >
                  {isGeneratingMesh ? 'Generating...' : 'Preview Mesh'}
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please select a BIM element first.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="run" className="space-y-4">
            {selectedElementId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded">
                  <div>
                    <div className="font-medium">Analysis Configuration</div>
                    <div className="text-sm text-muted-foreground">
                      Type: {analysisType} | Element: {elements.find(e => e.id === selectedElementId)?.name}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {analysisType === 'modal' ? `${numberOfModes} modes` : 'Standard'}
                  </Badge>
                </div>

                <Button
                  onClick={handleRunAnalysis}
                  disabled={isRunningAnalysis || !selectedElementId}
                  className="cyber-button w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunningAnalysis ? 'Running Analysis...' : `Run ${analysisType} Analysis`}
                </Button>

                {analysisStatus.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Active Analyses</h4>
                    {analysisStatus.map((status: any) => (
                      <div key={status.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{status.id}</span>
                        <Badge variant={status.status === 'completed' ? 'default' : 'secondary'}>
                          {status.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please complete the setup and select an element to run analysis.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
