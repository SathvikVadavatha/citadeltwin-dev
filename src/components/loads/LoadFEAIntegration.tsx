
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  Calculator, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { LoadCalculationResult } from '@/types/loads';
import { useRealFEA } from '@/hooks/useRealFEA';
import { useFEAAnalyses } from '@/hooks/useFEAAnalyses';
import { useBIMElements } from '@/hooks/useBIMElements';

interface LoadFEAIntegrationProps {
  loadResults: LoadCalculationResult | null;
  onAnalysisComplete?: (results: any) => void;
}

export const LoadFEAIntegration = ({ loadResults, onAnalysisComplete }: LoadFEAIntegrationProps) => {
  const [selectedElementId, setSelectedElementId] = useState<string>('');
  const [transferringLoads, setTransferringLoads] = useState(false);
  const [activeTab, setActiveTab] = useState('transfer');

  const { elements } = useBIMElements();
  const { 
    runStaticAnalysis, 
    isRunningAnalysis 
  } = useRealFEA();
  
  const {
    createAnalysis,
    createLoad,
    createBoundaryCondition,
    runAnalysis
  } = useFEAAnalyses();

  const transferLoadsToFEA = async () => {
    if (!loadResults || !selectedElementId) return;

    setTransferringLoads(true);
    
    try {
      // Create FEA analysis
      const analysis = await createAnalysis({
        name: `Load Analysis - ${loadResults.parameters.city}`,
        description: `Automated load transfer from load calculation system`,
        analysis_type: 'static',
        element_id: selectedElementId,
        input_parameters: {
          loadCalculationId: loadResults.calculationTimestamp,
          buildingParameters: loadResults.parameters,
          transferMethod: 'automated'
        }
      });

      if (!analysis) {
        throw new Error('Failed to create FEA analysis');
      }

      // Transfer individual loads
      for (const load of loadResults.individualLoads) {
        await createLoad({
          analysis_id: analysis.id,
          load_type: mapLoadTypeToFEA(load.loadType),
          name: load.description,
          magnitude: load.magnitude,
          direction: load.direction,
          location: load.location,
          properties: {
            codeReference: load.codeReference,
            safetyFactor: load.safetyFactor,
            distribution: load.distribution
          }
        });
      }

      // Create boundary conditions (simplified - fixed at base)
      await createBoundaryCondition({
        analysis_id: analysis.id,
        condition_type: 'fixed',
        name: 'Base Fixed Support',
        location: { x: 0, y: 0, z: 0 },
        constraints: { x: true, y: true, z: true, rx: true, ry: true, rz: true },
        properties: {
          description: 'Fixed base condition for building analysis'
        }
      });

      // Run the analysis
      const success = await runAnalysis(analysis.id);
      
      if (success && onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }

      setActiveTab('status');
      
    } catch (error) {
      console.error('Error transferring loads to FEA:', error);
    } finally {
      setTransferringLoads(false);
    }
  };

  const mapLoadTypeToFEA = (loadType: string) => {
    const mapping: Record<string, any> = {
      'dead': 'gravity',
      'live': 'gravity', 
      'wind': 'wind_load',
      'seismic': 'seismic_load'
    };
    return mapping[loadType] || 'point_load';
  };

  const getLoadSummaryCards = () => {
    if (!loadResults) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-gray-400">
              {loadResults.individualLoads.filter(l => l.loadType === 'dead').length}
            </div>
            <div className="text-sm text-muted-foreground">Dead Loads</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-blue-400">
              {loadResults.individualLoads.filter(l => l.loadType === 'live').length}
            </div>
            <div className="text-sm text-muted-foreground">Live Loads</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-green-400">
              {loadResults.individualLoads.filter(l => l.loadType === 'wind').length}
            </div>
            <div className="text-sm text-muted-foreground">Wind Loads</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-red-400">
              {loadResults.individualLoads.filter(l => l.loadType === 'seismic').length}
            </div>
            <div className="text-sm text-muted-foreground">Seismic Loads</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Card className="gradient-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-500" />
          Load Calculation ↔ FEA Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transfer">Load Transfer</TabsTrigger>
            <TabsTrigger value="mapping">Load Mapping</TabsTrigger>
            <TabsTrigger value="status">Analysis Status</TabsTrigger>
          </TabsList>

          <TabsContent value="transfer" className="space-y-4">
            {!loadResults ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No load calculation results available. Please run a load calculation first.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {getLoadSummaryCards()}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transfer Loads to FEA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Structural Element
                      </label>
                      <select
                        value={selectedElementId}
                        onChange={(e) => setSelectedElementId(e.target.value)}
                        className="w-full p-2 border rounded cyber-button"
                      >
                        <option value="">Select an element...</option>
                        {elements.map(element => (
                          <option key={element.id} value={element.id}>
                            {element.name} ({element.element_type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-500" />
                        <span>Load Calculation Results</span>
                        <Badge variant="outline">
                          {loadResults.individualLoads.length} loads
                        </Badge>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-purple-500" />
                        <span>FEA Analysis</span>
                        <Badge variant="outline">
                          {selectedElementId ? 'Ready' : 'Select Element'}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      onClick={transferLoadsToFEA}
                      disabled={!selectedElementId || transferringLoads || isRunningAnalysis}
                      className="cyber-button w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {transferringLoads ? 'Transferring Loads...' : 'Transfer & Run FEA Analysis'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            {loadResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Load Type Mapping</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries({
                      'Dead Loads': 'gravity',
                      'Live Loads': 'gravity',
                      'Wind Loads': 'wind_load',
                      'Seismic Loads': 'seismic_load'
                    }).map(([loadCalcType, feaType]) => (
                      <div key={loadCalcType} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{loadCalcType}</Badge>
                          <span className="text-sm text-muted-foreground">from Load Calculation</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{feaType}</Badge>
                          <span className="text-sm text-muted-foreground">in FEA System</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Load calculation system active</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>FEA integration available</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {loadResults ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span>Load results {loadResults ? 'available' : 'pending'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedElementId ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span>Target element {selectedElementId ? 'selected' : 'not selected'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
