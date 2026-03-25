
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers, Activity, Download } from 'lucide-react';
import { useSpatialAnalysis } from '@/hooks/useSpatialAnalysis';
import { useGISData } from '@/hooks/useGISData';

export const SpatialAnalysisPanel = () => {
  const { gisLayers } = useGISData();
  const {
    analysisResults,
    isLoading,
    runIntersectionAnalysis,
    runBufferAnalysis,
    runProximityAnalysis,
    runOverlayAnalysis,
    fetchRealGISData
  } = useSpatialAnalysis();

  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [bufferDistance, setBufferDistance] = useState(100);
  const [bufferUnits, setBufferUnits] = useState('meters');
  const [proximityDistance, setProximityDistance] = useState(1000);
  const [overlayOperation, setOverlayOperation] = useState('union');
  const [fetchParams, setFetchParams] = useState({
    city: '',
    state: '',
    dataType: 'parcels' as 'parcels' | 'roads' | 'utilities' | 'osm_data',
    utilityType: 'water'
  });

  const handleLayerSelection = (layerId: string) => {
    setSelectedLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const handleFetchRealData = async () => {
    if (!fetchParams.city || !fetchParams.state) {
      return;
    }

    try {
      await fetchRealGISData({
        dataType: fetchParams.dataType,
        city: fetchParams.city,
        state: fetchParams.state,
        utilityType: fetchParams.dataType === 'utilities' ? fetchParams.utilityType : undefined
      });
    } catch (error) {
      console.error('Error fetching real GIS data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Spatial Analysis & Real Data Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fetch-data" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fetch-data">Fetch Real Data</TabsTrigger>
              <TabsTrigger value="analysis">Spatial Analysis</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="fetch-data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fetch Real-World GIS Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={fetchParams.city}
                        onChange={(e) => setFetchParams(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="e.g., San Francisco"
                        className="skeuo-button"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={fetchParams.state}
                        onChange={(e) => setFetchParams(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="e.g., CA"
                        className="skeuo-button"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Type</Label>
                      <Select
                        value={fetchParams.dataType}
                        onValueChange={(value: any) => setFetchParams(prev => ({ ...prev, dataType: value }))}
                      >
                        <SelectTrigger className="skeuo-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parcels">Property Parcels (ArcGIS)</SelectItem>
                          <SelectItem value="roads">Road Networks (OpenStreetMap)</SelectItem>
                          <SelectItem value="utilities">Utilities (EPA/OSM)</SelectItem>
                          <SelectItem value="osm_data">General OSM Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {fetchParams.dataType === 'utilities' && (
                      <div className="space-y-2">
                        <Label>Utility Type</Label>
                        <Select
                          value={fetchParams.utilityType}
                          onValueChange={(value) => setFetchParams(prev => ({ ...prev, utilityType: value }))}
                        >
                          <SelectTrigger className="skeuo-button">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="water">Water Systems</SelectItem>
                            <SelectItem value="electric">Electrical Grid</SelectItem>
                            <SelectItem value="gas">Natural Gas</SelectItem>
                            <SelectItem value="telecom">Telecommunications</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleFetchRealData}
                    disabled={isLoading || !fetchParams.city || !fetchParams.state}
                    className="skeuo-button w-full"
                  >
                    {isLoading ? 'Fetching Data...' : 'Fetch Real GIS Data'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Layer Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gisLayers.map(layer => (
                      <div key={layer.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={layer.id}
                          checked={selectedLayers.includes(layer.id)}
                          onChange={() => handleLayerSelection(layer.id)}
                          className="rounded border-border"
                        />
                        <label htmlFor={layer.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span>{layer.layer_name}</span>
                            <div className="flex gap-2">
                              <Badge variant="secondary">{layer.layer_type}</Badge>
                              <Badge variant="outline">{layer.feature_count} features</Badge>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Buffer Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Distance</Label>
                      <Input
                        type="number"
                        value={bufferDistance}
                        onChange={(e) => setBufferDistance(Number(e.target.value))}
                        className="skeuo-button"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Units</Label>
                      <Select value={bufferUnits} onValueChange={setBufferUnits}>
                        <SelectTrigger className="skeuo-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meters">Meters</SelectItem>
                          <SelectItem value="feet">Feet</SelectItem>
                          <SelectItem value="kilometers">Kilometers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => runBufferAnalysis(selectedLayers, bufferDistance, bufferUnits)}
                      disabled={selectedLayers.length === 0 || isLoading}
                      className="skeuo-button w-full"
                    >
                      Run Buffer Analysis
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Proximity Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Max Distance (meters)</Label>
                      <Input
                        type="number"
                        value={proximityDistance}
                        onChange={(e) => setProximityDistance(Number(e.target.value))}
                        className="skeuo-button"
                      />
                    </div>
                    <Button 
                      onClick={() => runProximityAnalysis(selectedLayers, proximityDistance)}
                      disabled={selectedLayers.length < 2 || isLoading}
                      className="skeuo-button w-full"
                    >
                      Run Proximity Analysis
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Intersection Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => runIntersectionAnalysis(selectedLayers)}
                      disabled={selectedLayers.length < 2 || isLoading}
                      className="skeuo-button w-full"
                    >
                      Find Intersections
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overlay Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Operation</Label>
                      <Select value={overlayOperation} onValueChange={setOverlayOperation}>
                        <SelectTrigger className="skeuo-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="union">Union</SelectItem>
                          <SelectItem value="intersection">Intersection</SelectItem>
                          <SelectItem value="difference">Difference</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => runOverlayAnalysis(selectedLayers, overlayOperation)}
                      disabled={selectedLayers.length < 2 || isLoading}
                      className="skeuo-button w-full"
                    >
                      Run Overlay
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResults.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No analysis results yet. Run some spatial analyses to see results here.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {analysisResults.map((result) => (
                        <Card key={result.id} className="gradient-border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold capitalize">{result.analysis_type} Analysis</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(result.created_at).toLocaleString()}
                                </p>
                              </div>
                              <Button variant="outline" size="sm" className="skeuo-button">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                            </div>
                            
                            {result.result_data.summary && (
                              <div className="grid grid-cols-3 gap-4 mt-4">
                                {Object.entries(result.result_data.summary).map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <p className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</p>
                                    <p className="font-semibold">{String(value)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
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
