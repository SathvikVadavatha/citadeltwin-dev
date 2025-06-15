
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ZoomIn, ZoomOut, Eye, AlertCircle, Package } from "lucide-react";
import { Enhanced3DViewer } from './Enhanced3DViewer';
import { use3DViewer } from '@/hooks/use3DViewer';
import * as THREE from 'three';

interface Model3DViewerProps {
  modelUrl?: string;
  modelName?: string;
  uploadId?: string;
  projectId?: string;
  onDownload?: () => void;
}

const Model3D = ({ url }: { url: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);
  
  // Always call useGLTF - no conditional calling
  let gltf;
  let loadError = false;
  
  try {
    gltf = useGLTF(url);
  } catch (err) {
    console.error('Error loading 3D model:', err);
    loadError = true;
  }

  // Always call useFrame - no conditional calling
  useFrame(() => {
    if (meshRef.current && !hasError && !loadError) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Always call useEffect - no conditional calling
  useEffect(() => {
    if (loadError) {
      setHasError(true);
      return;
    }

    if (gltf?.scene) {
      try {
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2 / maxDim : 1;
        
        gltf.scene.scale.setScalar(scale);
        gltf.scene.position.sub(center.multiplyScalar(scale));
      } catch (err) {
        console.error('Error processing 3D model:', err);
        setHasError(true);
      }
    }
  }, [gltf, loadError]);

  if (hasError || loadError) {
    return (
      <Html center>
        <div className="flex items-center justify-center text-red-500">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span>Failed to load 3D model</span>
        </div>
      </Html>
    );
  }

  return gltf?.scene ? <primitive ref={meshRef} object={gltf.scene} /> : null;
};

const LoadingFallback = () => (
  <Html center>
    <div className="flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm">Loading 3D model...</span>
    </div>
  </Html>
);

const ErrorFallback = ({ error }: { error: Error }) => (
  <Html center>
    <div className="flex flex-col items-center justify-center text-red-500 max-w-md p-4">
      <AlertCircle className="h-8 w-8 mb-2" />
      <span className="text-center text-sm">
        Failed to load 3D model. This is a demo environment.
      </span>
      <span className="text-xs text-gray-500 mt-2">
        {error.message}
      </span>
    </div>
  </Html>
);

export const Model3DViewer: React.FC<Model3DViewerProps> = ({ 
  modelUrl, 
  modelName = "3D Model",
  uploadId,
  projectId,
  onDownload 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelError, setModelError] = useState<Error | null>(null);
  const [useEnhancedViewer, setUseEnhancedViewer] = useState(true);

  // Use enhanced viewer with BIM data if uploadId or projectId is provided
  const { 
    hasElements, 
    elements, 
    feaResults, 
    loading,
    elementCount 
  } = use3DViewer(uploadId, projectId);

  console.log('Model3DViewer state:', {
    hasElements,
    elementCount,
    loading,
    uploadId,
    projectId,
    useEnhancedViewer
  });

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // If we have BIM elements or are in loading state, use the enhanced viewer
  if (useEnhancedViewer && (hasElements || loading || uploadId || projectId)) {
    return (
      <Enhanced3DViewer
        elements={elements}
        feaResults={feaResults}
        onDownload={onDownload}
      />
    );
  }

  // Fallback to basic GLB/GLTF viewer
  const viewerContent = (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-96'}`}>
      <Canvas
        camera={{ 
          position: [5, 5, 5], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'linear-gradient(to bottom, #f0f0f0, #ffffff)' }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setModelError(new Error('3D rendering error'));
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        <Suspense fallback={<LoadingFallback />}>
          {modelError ? (
            <ErrorFallback error={modelError} />
          ) : modelUrl ? (
            <Model3D url={modelUrl} />
          ) : (
            <Html center>
              <div className="flex flex-col items-center justify-center text-gray-500">
                <Package className="h-12 w-12 mb-4" />
                <span>No 3D model available</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseEnhancedViewer(true)}
                  className="mt-2"
                >
                  Switch to Enhanced Viewer
                </Button>
              </div>
            </Html>
          )}
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
      
      {/* 3D Viewer Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreen}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isFullscreen ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
        </Button>
        {onDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseEnhancedViewer(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Package className="h-4 w-4" />
        </Button>
      </div>

      {isFullscreen && (
        <div className="absolute top-4 left-4">
          <Button
            variant="outline"
            onClick={() => setIsFullscreen(false)}
          >
            Exit Fullscreen
          </Button>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return viewerContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            3D Model Viewer
          </div>
          <Badge variant="secondary">{modelName}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {viewerContent}
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>Use mouse to rotate, zoom, and pan the 3D model</p>
          {modelError && (
            <p className="text-red-500 mt-2">
              Note: This is a demo environment with mock 3D models
            </p>
          )}
          {!hasElements && !loading && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseEnhancedViewer(true)}
              >
                Switch to Enhanced BIM Viewer
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
