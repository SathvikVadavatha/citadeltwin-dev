
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Play, 
  Pause, 
  Square, 
  Download,
  Eye,
  Layers,
  Target,
  Camera,
  Palette
} from 'lucide-react';

interface FEAResultsVisualizerProps {
  analysisId: string;
}

export const FEAResultsVisualizer: React.FC<FEAResultsVisualizerProps> = ({
  analysisId
}) => {
  const [resultType, setResultType] = useState('displacement');
  const [timeStep, setTimeStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContours, setShowContours] = useState(true);
  const [showVectors, setShowVectors] = useState(false);
  const [deformationScale, setDeformationScale] = useState(1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Advanced Results Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contours" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contours">Contours</TabsTrigger>
              <TabsTrigger value="vectors">Vectors</TabsTrigger>
              <TabsTrigger value="animation">Animation</TabsTrigger>
              <TabsTrigger value="extraction">Data</TabsTrigger>
            </TabsList>

            <TabsContent value="contours" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Result Type</Label>
                  <Select value={resultType} onValueChange={setResultType}>
                    <SelectTrigger className="cyber-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="displacement">Displacement</SelectItem>
                      <SelectItem value="stress">Von Mises Stress</SelectItem>
                      <SelectItem value="strain">Strain</SelectItem>
                      <SelectItem value="safety_factor">Safety Factor</SelectItem>
                      <SelectItem value="principal_stress">Principal Stress</SelectItem>
                      <SelectItem value="shear_stress">Shear Stress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Component</Label>
                  <Select defaultValue="magnitude">
                    <SelectTrigger className="cyber-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="magnitude">Magnitude</SelectItem>
                      <SelectItem value="x">X-Component</SelectItem>
                      <SelectItem value="y">Y-Component</SelectItem>
                      <SelectItem value="z">Z-Component</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showContours}
                    onCheckedChange={setShowContours}
                  />
                  <Label>Show Contour Fill</Label>
                </div>

                <div>
                  <Label className="block mb-2">Deformation Scale Factor: {deformationScale}x</Label>
                  <Slider
                    value={[deformationScale]}
                    onValueChange={(value) => setDeformationScale(value[0])}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Color Legend</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-4 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 rounded"></div>
                    <div className="flex justify-between w-full text-xs">
                      <span>Min: 0.0</span>
                      <span>Max: 250.0 MPa</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vectors" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  checked={showVectors}
                  onCheckedChange={setShowVectors}
                />
                <Label>Show Vector Field</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vector Type</Label>
                  <Select defaultValue="displacement">
                    <SelectTrigger className="cyber-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="displacement">Displacement</SelectItem>
                      <SelectItem value="velocity">Velocity</SelectItem>
                      <SelectItem value="acceleration">Acceleration</SelectItem>
                      <SelectItem value="reaction">Reaction Forces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vector Scale</Label>
                  <Slider defaultValue={[1]} max={5} step={0.1} className="w-full" />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Vector Display Options</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label className="text-sm">Show Vector Arrows</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label className="text-sm">Show Magnitude Labels</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="animation" className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border rounded-lg">
                <h4 className="font-medium mb-4">Time History Animation</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label className="block mb-2">Time Step: {timeStep}/100</Label>
                    <Slider
                      value={[timeStep]}
                      onValueChange={(value) => setTimeStep(value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant={isAnimating ? "secondary" : "default"}
                      onClick={() => setIsAnimating(!isAnimating)}
                      className="cyber-button"
                    >
                      {isAnimating ? (
                        <Pause className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isAnimating ? 'Pause' : 'Play'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsAnimating(false);
                        setTimeStep(0);
                      }}
                      className="cyber-button"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Time: {(timeStep * 0.01).toFixed(2)} seconds
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Animation Speed</Label>
                <Select defaultValue="normal">
                  <SelectTrigger className="cyber-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow (0.5x)</SelectItem>
                    <SelectItem value="normal">Normal (1x)</SelectItem>
                    <SelectItem value="fast">Fast (2x)</SelectItem>
                    <SelectItem value="vfast">Very Fast (5x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="extraction" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Extraction Method</Label>
                  <Select defaultValue="nodal">
                    <SelectTrigger className="cyber-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nodal">Nodal Values</SelectItem>
                      <SelectItem value="element">Element Values</SelectItem>
                      <SelectItem value="path">Path Results</SelectItem>
                      <SelectItem value="section">Section Cut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Data Export Options</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="cyber-button">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" className="cyber-button">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="cyber-button">
                      <Camera className="h-4 w-4 mr-2" />
                      Save Image
                    </Button>
                    <Button variant="outline" className="cyber-button">
                      <Palette className="h-4 w-4 mr-2" />
                      Export Animation
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border rounded text-sm">
                  <strong>Available Data:</strong> Displacement, Stress, Strain, Safety Factor, 
                  Reaction Forces, Modal Frequencies, Mode Shapes
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            View Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" className="cyber-button">
              <Layers className="h-4 w-4 mr-2" />
              Isometric
            </Button>
            <Button variant="outline" className="cyber-button">
              <Eye className="h-4 w-4 mr-2" />
              Front View
            </Button>
            <Button variant="outline" className="cyber-button">
              <Camera className="h-4 w-4 mr-2" />
              Top View
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Switch defaultChecked />
            <Label>Show Mesh</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch />
            <Label>Show Undeformed Shape</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
