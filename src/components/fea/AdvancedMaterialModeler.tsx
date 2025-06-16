
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Database, Thermometer, Package, Layers } from 'lucide-react';

interface AdvancedMaterialModelerProps {
  analysisId: string;
}

export const AdvancedMaterialModeler: React.FC<AdvancedMaterialModelerProps> = ({
  analysisId
}) => {
  const [materialType, setMaterialType] = useState<'linear' | 'nonlinear' | 'composite' | 'thermal'>('linear');
  const [temperatureDependent, setTemperatureDependent] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-500" />
            Advanced Material Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={materialType} onValueChange={(value: any) => setMaterialType(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="linear">Linear</TabsTrigger>
              <TabsTrigger value="nonlinear">Nonlinear</TabsTrigger>
              <TabsTrigger value="composite">Composite</TabsTrigger>
              <TabsTrigger value="thermal">Thermal</TabsTrigger>
            </TabsList>

            <TabsContent value="linear" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Young's Modulus (Pa)</Label>
                  <Input type="number" defaultValue="200e9" className="cyber-button" />
                </div>
                <div className="space-y-2">
                  <Label>Poisson's Ratio</Label>
                  <Input type="number" defaultValue="0.3" step="0.01" className="cyber-button" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Density (kg/m³)</Label>
                  <Input type="number" defaultValue="7850" className="cyber-button" />
                </div>
                <div className="space-y-2">
                  <Label>Yield Strength (Pa)</Label>
                  <Input type="number" defaultValue="250e6" className="cyber-button" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nonlinear" className="space-y-4">
              <div className="space-y-2">
                <Label>Constitutive Model</Label>
                <Select defaultValue="bilinear">
                  <SelectTrigger className="cyber-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bilinear">Bilinear Kinematic</SelectItem>
                    <SelectItem value="multilinear">Multilinear Kinematic</SelectItem>
                    <SelectItem value="vonmises">Von Mises Plasticity</SelectItem>
                    <SelectItem value="drucker">Drucker-Prager</SelectItem>
                    <SelectItem value="concrete">Concrete Damage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hardening Modulus (Pa)</Label>
                  <Input type="number" defaultValue="2e9" className="cyber-button" />
                </div>
                <div className="space-y-2">
                  <Label>Ultimate Strength (Pa)</Label>
                  <Input type="number" defaultValue="400e6" className="cyber-button" />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Stress-Strain Curve Data</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="cyber-button">
                    Import Curve Data
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    Supported formats: CSV, TXT (stress, strain pairs)
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="composite" className="space-y-4">
              <div className="space-y-2">
                <Label>Composite Type</Label>
                <Select defaultValue="laminate">
                  <SelectTrigger className="cyber-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laminate">Laminated Composite</SelectItem>
                    <SelectItem value="sandwich">Sandwich Panel</SelectItem>
                    <SelectItem value="chopped">Chopped Fiber</SelectItem>
                    <SelectItem value="woven">Woven Fabric</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>E11 (Pa)</Label>
                  <Input type="number" defaultValue="150e9" className="cyber-button" />
                </div>
                <div className="space-y-2">
                  <Label>E22 (Pa)</Label>
                  <Input type="number" defaultValue="10e9" className="cyber-button" />
                </div>
                <div className="space-y-2">
                  <Label>G12 (Pa)</Label>
                  <Input type="number" defaultValue="5e9" className="cyber-button" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Layer Configuration</h4>
                <div className="space-y-2">
                  {[0, 45, -45, 90].map((angle, index) => (
                    <div key={index} className="flex items-center gap-4 p-2 border rounded">
                      <span className="w-16">Layer {index + 1}:</span>
                      <Input 
                        type="number" 
                        value={angle} 
                        className="w-20 cyber-button" 
                        placeholder="Angle"
                      />
                      <span>°</span>
                      <Input 
                        type="number" 
                        defaultValue="0.125" 
                        step="0.001"
                        className="w-24 cyber-button" 
                        placeholder="Thickness"
                      />
                      <span>mm</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="cyber-button">
                  <Layers className="h-4 w-4 mr-2" />
                  Add Layer
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="thermal" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  checked={temperatureDependent}
                  onCheckedChange={setTemperatureDependent}
                />
                <Label>Temperature Dependent Properties</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thermal Conductivity (W/m·K)</Label>
                  <Input type="number" defaultValue="50" className="cyber-button" />
                </div>
                <div className="space-y-2">
                  <Label>Specific Heat (J/kg·K)</Label>
                  <Input type="number" defaultValue="460" className="cyber-button" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thermal Expansion (1/K)</Label>
                  <Input type="number" defaultValue="12e-6" step="1e-6" className="cyber-button" />
                </div>
                <div className="space-y-2">
                  <Label>Reference Temperature (°C)</Label>
                  <Input type="number" defaultValue="20" className="cyber-button" />
                </div>
              </div>

              {temperatureDependent && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Temperature-Dependent Data</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="cyber-button">
                      <Thermometer className="h-4 w-4 mr-2" />
                      Import Temperature Curves
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Define property variation with temperature
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button className="cyber-button">
              <Package className="h-4 w-4 mr-2" />
              Save Material
            </Button>
            <Button variant="outline" className="cyber-button">
              Load from Library
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
