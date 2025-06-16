
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, Zap, BarChart3 } from 'lucide-react';

interface DynamicAnalysisPanelProps {
  selectedAnalysisId: string;
  onAnalysisSelect: (id: string) => void;
}

export const DynamicAnalysisPanel: React.FC<DynamicAnalysisPanelProps> = ({
  selectedAnalysisId,
  onAnalysisSelect
}) => {
  const [analysisType, setAnalysisType] = useState<'transient' | 'harmonic' | 'spectral'>('transient');
  const [timeParameters, setTimeParameters] = useState({
    totalTime: 10,
    timeStep: 0.01,
    dampingRatio: 0.05
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Dynamic Analysis Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transient">Transient</TabsTrigger>
              <TabsTrigger value="harmonic">Harmonic</TabsTrigger>
              <TabsTrigger value="spectral">Spectral</TabsTrigger>
            </TabsList>

            <TabsContent value="transient" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Time (s)</Label>
                  <Input
                    type="number"
                    value={timeParameters.totalTime}
                    onChange={(e) => setTimeParameters(prev => ({
                      ...prev,
                      totalTime: Number(e.target.value)
                    }))}
                    className="cyber-button"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Step (s)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={timeParameters.timeStep}
                    onChange={(e) => setTimeParameters(prev => ({
                      ...prev,
                      timeStep: Number(e.target.value)
                    }))}
                    className="cyber-button"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Damping Ratio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={timeParameters.dampingRatio}
                  onChange={(e) => setTimeParameters(prev => ({
                    ...prev,
                    dampingRatio: Number(e.target.value)
                  }))}
                  className="cyber-button"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Analysis Summary</h4>
                <div className="space-y-1 text-sm">
                  <div>Total Steps: {Math.ceil(timeParameters.totalTime / timeParameters.timeStep)}</div>
                  <div>Estimated Runtime: {Math.ceil(timeParameters.totalTime / timeParameters.timeStep * 0.1)} seconds</div>
                  <div>Memory Required: ~{Math.ceil(timeParameters.totalTime / timeParameters.timeStep * 0.001)} MB</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="harmonic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Frequency (Hz)</Label>
                  <Input type="number" defaultValue="0.1" className="cyber-button" />
                </div>
                <div className="space-y-2">
                  <Label>End Frequency (Hz)</Label>
                  <Input type="number" defaultValue="100" className="cyber-button" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequency Steps</Label>
                <Input type="number" defaultValue="100" className="cyber-button" />
              </div>
            </TabsContent>

            <TabsContent value="spectral" className="space-y-4">
              <div className="space-y-2">
                <Label>Response Spectrum File</Label>
                <Input type="file" accept=".txt,.csv" className="cyber-button" />
              </div>
              <div className="space-y-2">
                <Label>Scale Factor</Label>
                <Input type="number" defaultValue="1.0" className="cyber-button" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button className="cyber-button flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Run Dynamic Analysis
            </Button>
            <Button variant="outline" className="cyber-button">
              <BarChart3 className="h-4 w-4 mr-2" />
              Preview Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Time Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Integration Method</Label>
            <Select defaultValue="newmark">
              <SelectTrigger className="cyber-button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newmark">Newmark-β Method</SelectItem>
                <SelectItem value="wilson">Wilson-θ Method</SelectItem>
                <SelectItem value="central">Central Difference</SelectItem>
                <SelectItem value="houbolt">Houbolt Method</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Beta Parameter</Label>
              <Input type="number" defaultValue="0.25" step="0.01" className="cyber-button" />
            </div>
            <div className="space-y-2">
              <Label>Gamma Parameter</Label>
              <Input type="number" defaultValue="0.5" step="0.01" className="cyber-button" />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm">
              <strong>Newmark-β Method:</strong> Unconditionally stable for β ≥ 0.25 and γ ≥ 0.5
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
