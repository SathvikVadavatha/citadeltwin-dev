
import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import { PerformanceOptimizer } from '@/utils/performance/performanceOptimizer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye } from "lucide-react";

interface OptimizedModel3DViewerProps {
  modelUrl?: string;
  modelName?: string;
  uploadId?: string;
  projectId?: string;
  enableLOD?: boolean;
  performanceMode?: 'high' | 'medium' | 'low';
}

const Performance3DControls = React.memo(() => (
  <OrbitControls 
    enableDamping
    dampingFactor={0.05}
    maxPolarAngle={Math.PI / 2}
    minDistance={1}
    maxDistance={20}
    enablePan={true}
    enableZoom={true}
    enableRotate={true}
  />
));

const OptimizedCanvas = React.memo<{ 
  children: React.ReactNode;
  performanceMode: 'high' | 'medium' | 'low';
}>(({ children, performanceMode }) => {
  const canvasSettings = useMemo(() => {
    const base = PerformanceOptimizer.optimize3DRendering();
    
    switch (performanceMode) {
      case 'high':
        return { ...base.webglSettings, antialias: true, precision: 'highp' };
      case 'medium':
        return { ...base.webglSettings, precision: 'mediump' };
      case 'low':
        return { ...base.webglSettings, precision: 'lowp', alpha: false };
      default:
        return base.webglSettings;
    }
  }, [performanceMode]);

  return (
    <Canvas
      gl={canvasSettings}
      camera={{ 
        position: [5, 5, 5], 
        fov: 50,
        near: 0.1,
        far: 1000
      }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={performanceMode === 'high' ? 2048 : 1024}
        shadow-mapSize-height={performanceMode === 'high' ? 2048 : 1024}
      />
      
      <Suspense fallback={null}>
        {children}
        <Preload all />
      </Suspense>
      
      <Performance3DControls />
    </Canvas>
  );
});

const LoadingFallback = React.memo(() => (
  <div className="flex items-center justify-center h-96">
    <div className="flex items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm">Optimizing 3D model...</span>
    </div>
  </div>
));

export const OptimizedModel3DViewer: React.FC<OptimizedModel3DViewerProps> = React.memo(({ 
  modelUrl, 
  modelName = "3D Model",
  uploadId,
  projectId,
  enableLOD = true,
  performanceMode = 'medium'
}) => {
  const optimizedModelLoader = useMemo(() => {
    if (!modelUrl) return null;
    
    return PerformanceOptimizer.createLazyLoader(
      async () => {
        // Simulate optimized model loading
        const response = await fetch(modelUrl);
        return response.blob();
      }
    );
  }, [modelUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Optimized 3D Viewer
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{modelName}</Badge>
            <Badge 
              variant={performanceMode === 'high' ? 'default' : performanceMode === 'medium' ? 'secondary' : 'outline'}
            >
              {performanceMode.toUpperCase()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingFallback />}>
          <div className="h-96 relative">
            <OptimizedCanvas performanceMode={performanceMode}>
              {/* 3D content would be rendered here */}
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="orange" />
              </mesh>
            </OptimizedCanvas>
          </div>
        </Suspense>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>Performance Mode: {performanceMode} | LOD: {enableLOD ? 'Enabled' : 'Disabled'}</p>
          <p>Use mouse to rotate, zoom, and pan • Optimized for {performanceMode} performance</p>
        </div>
      </CardContent>
    </Card>
  );
});
