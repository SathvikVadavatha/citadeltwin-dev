
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Thermometer, 
  Wind, 
  BarChart3, 
  Clock,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';

interface ComplexLoadingPanelProps {
  analysisId: string;
}

export const ComplexLoadingPanel: React.FC<ComplexLoadingPanelProps> = ({
  analysisId
}) => {
  const [loadType, setLoadType] = useState<'static' | 'dynamic' | 'thermal' | 'pressure'>('static');
  const [timeVarying, setTimeVarying] = useState(false);
  const [loads, setLoads] = useState([
    { id: 1, type: 'force', magnitude: 1000, direction: 'Z', location: 'Node 1' }
  ]);

  const addLoad = () => {
    const newLoad = {
      id: loads.length + 1,
      type: 'force',
      magnitude: 0,
      direction: 'Z',
      location: `Node ${loads.length + 1}`
    };
    setLoads([...loads, newLoad]);
  };

  const removeLoad = (id: number) => {
    setLoads(loads.filter(load => load.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Complex Loading Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={loadType} onValueChange={(value: any) => setLoadType(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="static">Static</TabsTrigger>
              <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
              <TabsTrigger value="thermal">Thermal</TabsTrigger>
              <TabsTrigger value="pressure">Pressure</TabsTrigger>
            </TabsList>

            <TabsContent value="static" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  checked={timeVarying}
                  onCheckedChange={setTimeVarying}
                />
                <Label>Time-Varying Load</Label>
              </div>

              <div className="space-y-4">
                {loads.map((load, index) => (
                  <div key={load.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Load {index + 1}</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeLoad(load.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Load Type</Label>
                        <Select defaultValue="force">
                          <SelectTrigger className="skeuo-button">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="force">Concentrated Force</SelectItem>
                            <SelectItem value="moment">Moment</SelectItem>
                            <SelectItem value="distributed">Distributed Load</SelectItem>
                            <SelectItem value="pressure">Surface Pressure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Magnitude</Label>
                        <Input 
                          type="number" 
                          defaultValue={load.magnitude}
                          className="skeuo-button" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Direction</Label>
                        <Select defaultValue={load.direction}>
                          <SelectTrigger className="skeuo-button">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="X">X-Direction</SelectItem>
                            <SelectItem value="Y">Y-Direction</SelectItem>
                            <SelectItem value="Z">Z-Direction</SelectItem>
                            <SelectItem value="custom">Custom Vector</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {timeVarying && (
                      <div className="p-3 bg-muted rounded">
                        <h5 className="font-medium mb-2">Time Function</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Function Type</Label>
                            <Select defaultValue="sine">
                              <SelectTrigger className="skeuo-button">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sine">Sinusoidal</SelectItem>
                                <SelectItem value="ramp">Ramp</SelectItem>
                                <SelectItem value="step">Step</SelectItem>
                                <SelectItem value="impulse">Impulse</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Frequency (Hz)</Label>
                            <Input type="number" defaultValue="1.0" className="skeuo-button" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={addLoad}
                  className="skeuo-button w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Load
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="dynamic" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dynamic Load Type</Label>
                  <Select defaultValue="harmonic">
                    <SelectTrigger className="skeuo-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harmonic">Harmonic Excitation</SelectItem>
                      <SelectItem value="seismic">Seismic Ground Motion</SelectItem>
                      <SelectItem value="impact">Impact Load</SelectItem>
                      <SelectItem value="wind">Wind Loading</SelectItem>
                      <SelectItem value="rotating">Rotating Unbalance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amplitude</Label>
                    <Input type="number" defaultValue="1000" className="skeuo-button" />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency (Hz)</Label>
                    <Input type="number" defaultValue="10" className="skeuo-button" />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium mb-2">Load History Input</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="skeuo-button">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Time History
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Supported formats: CSV, TXT (time, amplitude pairs)
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="thermal" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Thermal Load Type</Label>
                  <Select defaultValue="temperature">
                    <SelectTrigger className="skeuo-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">Temperature Distribution</SelectItem>
                      <SelectItem value="heat_flux">Heat Flux</SelectItem>
                      <SelectItem value="convection">Convection</SelectItem>
                      <SelectItem value="radiation">Radiation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (°C)</Label>
                    <Input type="number" defaultValue="100" className="skeuo-button" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Temp (°C)</Label>
                    <Input type="number" defaultValue="20" className="skeuo-button" />
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Thermal Effects</span>
                  </div>
                  <div className="text-sm">
                    Include thermal expansion and temperature-dependent material properties
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pressure" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pressure Type</Label>
                  <Select defaultValue="uniform">
                    <SelectTrigger className="skeuo-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uniform">Uniform Pressure</SelectItem>
                      <SelectItem value="hydrostatic">Hydrostatic Pressure</SelectItem>
                      <SelectItem value="wind">Wind Pressure</SelectItem>
                      <SelectItem value="internal">Internal Pressure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pressure Value (Pa)</Label>
                    <Input type="number" defaultValue="1000" className="skeuo-button" />
                  </div>
                  <div className="space-y-2">
                    <Label>Application Surface</Label>
                    <Select defaultValue="top">
                      <SelectTrigger className="skeuo-button">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top Surface</SelectItem>
                        <SelectItem value="bottom">Bottom Surface</SelectItem>
                        <SelectItem value="side">Side Surface</SelectItem>
                        <SelectItem value="all">All Surfaces</SelectItem>
                        <SelectItem value="custom">Custom Selection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Pressure Distribution</span>
                  </div>
                  <div className="text-sm">
                    Define spatial variation of pressure across the surface
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button className="skeuo-button">
              <BarChart3 className="h-4 w-4 mr-2" />
              Apply Loads
            </Button>
            <Button variant="outline" className="skeuo-button">
              <Clock className="h-4 w-4 mr-2" />
              Preview Time History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
