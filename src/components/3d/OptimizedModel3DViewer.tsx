
import React, { Suspense, useMemo, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import { ViewerPerformanceManager } from '@/utils/3d/ViewerPerformanceManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye } from "lucide-react";

interface OptimizedModel3DViewerProps {
  modelUrl?: string;
  modelName?: string;
  uploadId?: string;
  projectId?: string;
  viewerId?: string;
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
  settings: any;
}>(({ children, settings }) => {
  return (
    <Canvas
      gl={settings}
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
        castShadow={settings.shadows}
        shadow-mapSize-width={settings.shadowMapSize}
        shadow-mapSize-height={settings.shadowMapSize}
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
  viewerId = `viewer-${Math.random().toString(36).substr(2, 9)}`
}) => {
  const performanceManager = ViewerPerformanceManager.getInstance();
  const metricsRef = useRef({ fps: 0, triangles: 0 });

  // Register/unregister viewer with performance manager
  useEffect(() => {
    performanceManager.registerViewer(viewerId);
    
    return () => {
      performanceManager.unregisterViewer(viewerId);
    };
  }, [viewerId, performanceManager]);

  // Get optimized settings from performance manager
  const optimizedSettings = useMemo(() => {
    const settings = performanceManager.getOptimizedSettings(viewerId);
    const canvasSettings = performanceManager.getCanvasSettings();
    
    return {
      ...canvasSettings,
      shadows: settings.enableShadows,
      shadowMapSize: settings.mode === 'high' ? 2048 : 1024,
      mode: settings.mode,
      enableLOD: settings.enableLOD,
    };
  }, [viewerId, performanceManager]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Update performance metrics
      performanceManager.updatePerformanceMetrics(viewerId, metricsRef.current);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [viewerId, performanceManager]);

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
              variant={optimizedSettings.mode === 'high' ? 'default' : 
                     optimizedSettings.mode === 'medium' ? 'secondary' : 'outline'}
            >
              {optimizedSettings.mode.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              Viewers: {performanceManager.getActiveViewersCount()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingFallback />}>
          <div className="h-96 relative">
            <OptimizedCanvas settings={optimizedSettings}>
              {/* 3D content would be rendered here */}
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="orange" />
              </mesh>
            </OptimizedCanvas>
          </div>
        </Suspense>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>
            Performance: {optimizedSettings.mode} | 
            LOD: {optimizedSettings.enableLOD ? 'Enabled' : 'Disabled'} | 
            Shadows: {optimizedSettings.shadows ? 'On' : 'Off'}
          </p>
          <p>Use mouse to rotate, zoom, and pan • Auto-optimized for best performance</p>
        </div>
      </CardContent>
    </Card>
  );
});
