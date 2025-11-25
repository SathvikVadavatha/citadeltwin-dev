import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ProcessingResult } from './BlueprintTo3DConverter';

interface Blueprint3DViewerProps {
  result: ProcessingResult;
  onReset: () => void;
}

const GLBModel: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
};

export const Blueprint3DViewer: React.FC<Blueprint3DViewerProps> = ({ result, onReset }) => {
  const [activeTab, setActiveTab] = useState<'glb' | 'plotly'>('glb');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">3D Model Generated</h2>
          <p className="text-muted-foreground">
            Your blueprint has been successfully converted to a 3D model
          </p>
        </div>
        <Button onClick={onReset} variant="outline">
          Upload New Blueprint
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'glb' | 'plotly')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="glb">3D Model Viewer</TabsTrigger>
          <TabsTrigger value="plotly">Interactive Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="glb" className="space-y-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="h-[600px] bg-muted/20">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <GLBModel url={result.glb_url} />
                  <OrbitControls />
                  <gridHelper args={[20, 20]} />
                </Canvas>
              </Suspense>
            </div>
            <div className="p-4 bg-muted/10">
              <p className="text-sm text-muted-foreground">
                💡 Click and drag to rotate • Scroll to zoom • Right-click to pan
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Detected Rooms</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.detections.map((detection, idx) => (
                <div key={idx} className="text-sm">
                  <div className="font-medium">{detection.class?.replace('space_', '') || 'Room'}</div>
                  <div className="text-muted-foreground">
                    {detection.width_m}m × {detection.depth_m}m
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {detection.area_m2} m²
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plotly" className="space-y-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div 
              dangerouslySetInnerHTML={{ __html: result.html_view }}
              className="min-h-[600px]"
            />
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Interactive 3D Visualization (Plotly)</h3>
            <p className="text-sm text-muted-foreground">
              This visualization shows the detected rooms with full interactivity. Hover over rooms to see details.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
