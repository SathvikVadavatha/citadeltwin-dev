
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, MapPin, Building, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLoadCalculations } from '@/hooks/useLoadCalculations';
import { LoadCalculationParameters, LoadCalculationResult } from '@/types/loads';

export const LoadCalculationPanel = () => {
  const { calculateLoads, saveCalculation, calculating, saving } = useLoadCalculations();
  const [parameters, setParameters] = useState<LoadCalculationParameters>({
    buildingHeight: 20,
    buildingWidth: 30,
    buildingLength: 50,
    floorHeight: 4,
    numberOfFloors: 5,
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    occupancyType: 'commercial',
    structuralSystem: 'steel_frame',
    roofType: 'flat',
    exposureCategory: 'B',
    buildingCode: 'IBC2021',
    seismicDesignCategory: 'C',
    windSpeedCategory: 110
  });
  
  const [results, setResults] = useState<LoadCalculationResult | null>(null);
  const [activeTab, setActiveTab] = useState('parameters');

  const handleCalculate = async () => {
    try {
      const calculationResults = await calculateLoads(parameters);
      setResults(calculationResults);
      setActiveTab('results');
    } catch (error) {
      console.error('Load calculation error:', error);
    }
  };

  const handleSaveResults = async () => {
    if (results) {
      await saveCalculation(results);
    }
  };

  const getLoadTypeIcon = (loadType: string) => {
    switch (loadType) {
      case 'dead': return <Building className="h-4 w-4" />;
      case 'live': return <Zap className="h-4 w-4" />;
      case 'wind': return <MapPin className="h-4 w-4" />;
      case 'seismic': return <AlertTriangle className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getLoadTypeColor = (loadType: string) => {
    const colors: Record<string, string> = {
      dead: 'bg-gray-500/20 text-muted-foreground border-gray-400/50',
      live: 'bg-blue-500/20 text-blue-600 border-blue-600/50',
      wind: 'bg-green-500/20 text-green-600 border-green-600/50',
      seismic: 'bg-red-500/20 text-destructive border-destructive/50',
    };
    return colors[loadType] || 'bg-gray-500/20 text-muted-foreground border-gray-400/50';
  };

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Automated Load Calculation System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="combinations">Load Combinations</TabsTrigger>
              <TabsTrigger value="compliance">Code Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="parameters" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Building Geometry</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Building Width (m)</Label>
                        <Input
                          type="number"
                          value={parameters.buildingWidth}
                          onChange={(e) => setParameters(prev => ({ ...prev, buildingWidth: Number(e.target.value) }))}
                          className="skeuo-button"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Building Length (m)</Label>
                        <Input
                          type="number"
                          value={parameters.buildingLength}
                          onChange={(e) => setParameters(prev => ({ ...prev, buildingLength: Number(e.target.value) }))}
                          className="skeuo-button"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Floor Height (m)</Label>
                        <Input
                          type="number"
                          value={parameters.floorHeight}
                          onChange={(e) => setParameters(prev => ({ ...prev, floorHeight: Number(e.target.value) }))}
                          className="skeuo-button"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Number of Floors</Label>
                        <Input
                          type="number"
                          value={parameters.numberOfFloors}
                          onChange={(e) => setParameters(prev => ({ ...prev, numberOfFloors: Number(e.target.value) }))}
                          className="skeuo-button"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Location & Environment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={parameters.city}
                          onChange={(e) => setParameters(prev => ({ ...prev, city: e.target.value }))}
                          className="skeuo-button"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={parameters.state}
                          onChange={(e) => setParameters(prev => ({ ...prev, state: e.target.value }))}
                          className="skeuo-button"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Wind Speed (mph)</Label>
                        <Input
                          type="number"
                          value={parameters.windSpeedCategory}
                          onChange={(e) => setParameters(prev => ({ ...prev, windSpeedCategory: Number(e.target.value) }))}
                          className="skeuo-button"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Seismic Design Category</Label>
                        <Select
                          value={parameters.seismicDesignCategory}
                          onValueChange={(value: any) => setParameters(prev => ({ ...prev, seismicDesignCategory: value }))}
                        >
                          <SelectTrigger className="skeuo-button">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">SDC A (Low)</SelectItem>
                            <SelectItem value="B">SDC B (Low)</SelectItem>
                            <SelectItem value="C">SDC C (Moderate)</SelectItem>
                            <SelectItem value="D">SDC D (High)</SelectItem>
                            <SelectItem value="E">SDC E (Very High)</SelectItem>
                            <SelectItem value="F">SDC F (Very High)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Building Characteristics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Occupancy Type</Label>
                      <Select
                        value={parameters.occupancyType}
                        onValueChange={(value: any) => setParameters(prev => ({ ...prev, occupancyType: value }))}
                      >
                        <SelectTrigger className="skeuo-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="institutional">Institutional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Structural System</Label>
                      <Select
                        value={parameters.structuralSystem}
                        onValueChange={(value: any) => setParameters(prev => ({ ...prev, structuralSystem: value }))}
                      >
                        <SelectTrigger className="skeuo-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="steel_frame">Steel Frame</SelectItem>
                          <SelectItem value="concrete_frame">Concrete Frame</SelectItem>
                          <SelectItem value="wood_frame">Wood Frame</SelectItem>
                          <SelectItem value="masonry">Masonry</SelectItem>
                          <SelectItem value="composite">Composite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Code Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Building Code</Label>
                      <Select
                        value={parameters.buildingCode}
                        onValueChange={(value: any) => setParameters(prev => ({ ...prev, buildingCode: value }))}
                      >
                        <SelectTrigger className="skeuo-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IBC2021">IBC 2021</SelectItem>
                          <SelectItem value="IBC2018">IBC 2018</SelectItem>
                          <SelectItem value="IBC2015">IBC 2015</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Wind Exposure Category</Label>
                      <Select
                        value={parameters.exposureCategory}
                        onValueChange={(value: any) => setParameters(prev => ({ ...prev, exposureCategory: value }))}
                      >
                        <SelectTrigger className="skeuo-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B">Category B (Urban/Suburban)</SelectItem>
                          <SelectItem value="C">Category C (Open Terrain)</SelectItem>
                          <SelectItem value="D">Category D (Flat/Unobstructed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="skeuo-button bg-primary text-primary-foreground"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {calculating ? 'Calculating...' : 'Calculate Loads'}
                </Button>
              </div>

              {calculating && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Calculating loads...</span>
                        <span className="text-sm text-muted-foreground">Processing</span>
                      </div>
                      <Progress value={75} className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {results ? (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Building className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <div className="text-2xl font-bold">{(results.summary.totalDeadLoad / 1000).toFixed(0)} kN</div>
                        <div className="text-sm text-muted-foreground">Total Dead Load</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <div className="text-2xl font-bold">{(results.summary.totalLiveLoad / 1000).toFixed(0)} kN</div>
                        <div className="text-sm text-muted-foreground">Total Live Load</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <MapPin className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <div className="text-2xl font-bold">{(results.summary.maxWindLoad / 1000).toFixed(0)} kN</div>
                        <div className="text-sm text-muted-foreground">Max Wind Load</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                        <div className="text-2xl font-bold">{(results.summary.maxSeismicLoad / 1000).toFixed(0)} kN</div>
                        <div className="text-sm text-muted-foreground">Max Seismic Load</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Individual Load Components</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {results.individualLoads.map((load, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center space-x-3">
                              <Badge className={getLoadTypeColor(load.loadType)}>
                                {getLoadTypeIcon(load.loadType)}
                                <span className="ml-1 capitalize">{load.loadType}</span>
                              </Badge>
                              <span className="text-sm">{load.description}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{(load.magnitude / 1000).toFixed(1)} kN/m²</div>
                              <div className="text-sm text-muted-foreground">{load.codeReference}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveResults}
                      disabled={saving}
                      className="skeuo-button"
                    >
                      Save Calculation Results
                    </Button>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                    <p className="text-muted-foreground">
                      Configure parameters and run the calculation to see results.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="combinations" className="space-y-4">
              {results ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Load Combinations ({results.parameters.buildingCode})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.loadCombinations.map((combo, index) => (
                        <div key={index} className="p-4 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{combo.name}</h4>
                            <Badge variant={combo.category === 'strength' ? 'default' : 'secondary'}>
                              {combo.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{combo.description}</p>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Code Reference: </span>
                            <span>{combo.codeReference}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Load Combinations</h3>
                    <p className="text-muted-foreground">
                      Run a calculation to see applicable load combinations.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              {results ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {results.codeCompliance.isCompliant ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      Code Compliance Check
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={results.codeCompliance.isCompliant ? 'default' : 'secondary'}>
                        {results.codeCompliance.isCompliant ? 'COMPLIANT' : 'REVIEW REQUIRED'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Based on {results.parameters.buildingCode} requirements
                      </span>
                    </div>

                    {results.codeCompliance.warnings.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-yellow-500">Warnings:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {results.codeCompliance.warnings.map((warning, index) => (
                            <li key={index} className="text-sm">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Code References:</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.codeCompliance.references.map((ref, index) => (
                          <Badge key={index} variant="outline">{ref}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Compliance Check</h3>
                    <p className="text-muted-foreground">
                      Run a calculation to check code compliance.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
