
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ZoomIn, ZoomOut, Eye } from "lucide-react";
import * as THREE from 'three';

interface Model3DViewerProps {
  modelUrl: string;
  modelName: string;
  onDownload?: () => void;
}

const Model3D = ({ url }: { url: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, url);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    if (gltf.scene) {
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      
      gltf.scene.scale.setScalar(scale);
      gltf.scene.position.sub(center.multiplyScalar(scale));
    }
  }, [gltf]);

  return <primitive ref={meshRef} object={gltf.scene} />;
};

const LoadingFallback = () => (
  <Html center>
    <div className="flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm">Loading 3D model...</span>
    </div>
  </Html>
);

export const Model3DViewer: React.FC<Model3DViewerProps> = ({ 
  modelUrl, 
  modelName, 
  onDownload 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        <Suspense fallback={<LoadingFallback />}>
          <Model3D url={modelUrl} />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={20}
        />
        
        <gridHelper args={[10, 10, '#cccccc', '#eeeeee']} />
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
        </div>
      </CardContent>
    </Card>
  );
};
