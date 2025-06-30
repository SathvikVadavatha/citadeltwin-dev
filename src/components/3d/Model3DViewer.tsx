
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ZoomIn, ZoomOut, Eye, AlertCircle, Package, Cube } from "lucide-react";
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

// Simple 3D scene with basic geometry when no model is available
const DefaultScene = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Floor */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      
      {/* Simple building structure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 3, 6]} />
        <meshStandardMaterial color="#e3f2fd" />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 2, 0]}>
        <coneGeometry args={[3, 1.5, 4]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      
      {/* Door */}
      <mesh position={[2.1, -0.5, 0]}>
        <boxGeometry args={[0.2, 2, 1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      
      {/* Windows */}
      <mesh position={[2.1, 0.5, -1.5]}>
        <boxGeometry args={[0.2, 1, 1]} />
        <meshStandardMaterial color="#64b5f6" transparent opacity={0.7} />
      </mesh>
      
      <mesh position={[2.1, 0.5, 1.5]}>
        <boxGeometry args={[0.2, 1, 1]} />
        <meshStandardMaterial color="#64b5f6" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

const Model3D = ({ url }: { url: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);
  
  let gltf;
  let loadError = false;
  
  try {
    gltf = useGLTF(url);
  } catch (err) {
    console.error('Error loading 3D model:', err);
    loadError = true;
  }

  useFrame(() => {
    if (meshRef.current && !hasError && !loadError) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    if (loadError) {
      setHasError(true);
      return;
    }

    if (gltf?.scene) {
      try {
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
    return <DefaultScene />;
  }

  return gltf?.scene ? <primitive ref={meshRef} object={gltf.scene} /> : <DefaultScene />;
};

const LoadingFallback = () => (
  <Html center>
    <div className="flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
      <span className="text-sm">Loading 3D model...</span>
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
  const [useEnhancedViewer, setUseEnhancedViewer] = useState(false);

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

  // If enhanced viewer is explicitly requested and we have elements, use it
  if (useEnhancedViewer && hasElements) {
    return (
      <Enhanced3DViewer
        elements={elements}
        feaResults={feaResults}
        onDownload={onDownload}
      />
    );
  }

  const viewerContent = (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-96'}`}>
      <Canvas
        camera={{ 
          position: [8, 6, 8], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #f0f8ff)' }}
        shadows
      >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 5, -10]} intensity={0.3} />
        <hemisphereLight args={['#87CEEB', '#f0f8ff', 0.3]} />
        
        <Suspense fallback={<LoadingFallback />}>
          {modelUrl ? (
            <Model3D url={modelUrl} />
          ) : (
            <DefaultScene />
          )}
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={30}
          enableDamping
          dampingFactor={0.05}
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
        {hasElements && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseEnhancedViewer(true)}
            className="bg-background/80 backdrop-blur-sm"
            title="Switch to Enhanced BIM Viewer"
          >
            <Cube className="h-4 w-4" />
          </Button>
        )}
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
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{modelName}</Badge>
            {loading && <Badge variant="outline">Loading...</Badge>}
            {hasElements && (
              <Badge variant="default" className="bg-green-600">
                {elementCount} Elements
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {viewerContent}
        <div className="mt-4 text-sm text-muted-foreground text-center space-y-2">
          <p>Use mouse to rotate, zoom, and pan the 3D model</p>
          {!modelUrl && !hasElements && (
            <p className="text-blue-600">
              🏠 Showing default architectural model - upload a blueprint to generate a custom 3D model
            </p>
          )}
          {hasElements && !useEnhancedViewer && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseEnhancedViewer(true)}
              >
                <Cube className="h-4 w-4 mr-2" />
                Switch to Enhanced BIM Viewer
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
