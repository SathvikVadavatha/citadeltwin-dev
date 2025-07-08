
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ZoomIn, ZoomOut, Eye, AlertCircle, Package, Box } from "lucide-react";
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

// Enhanced 3D scene with better geometry and materials
const DefaultScene = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Floor with better material */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Main building structure */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 3.5, 7]} />
        <meshStandardMaterial color="#e8f4fd" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Roof removed for open floor plan view */}
      
      {/* Front Door */}
      <mesh position={[2.6, -0.5, 0]} castShadow>
        <boxGeometry args={[0.15, 2.2, 1.2]} />
        <meshStandardMaterial color="#654321" roughness={0.8} metalness={0.0} />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[2.65, -0.3, -0.3]} castShadow>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color="#ffd700" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Windows */}
      <mesh position={[2.6, 0.5, -2]} castShadow>
        <boxGeometry args={[0.15, 1.2, 1.2]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.8} roughness={0.1} metalness={0.0} />
      </mesh>
      
      <mesh position={[2.6, 0.5, 2]} castShadow>
        <boxGeometry args={[0.15, 1.2, 1.2]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.8} roughness={0.1} metalness={0.0} />
      </mesh>
      
      {/* Side windows */}
      <mesh position={[-1, 0.5, 3.6]} castShadow>
        <boxGeometry args={[1.2, 1.2, 0.15]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.8} roughness={0.1} metalness={0.0} />
      </mesh>
      
      <mesh position={[1, 0.5, 3.6]} castShadow>
        <boxGeometry args={[1.2, 1.2, 0.15]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.8} roughness={0.1} metalness={0.0} />
      </mesh>
      
      {/* Decorative elements */}
      <mesh position={[0, -1.5, 3.8]} castShadow>
        <boxGeometry args={[6, 0.3, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.0} />
      </mesh>
      
      {/* Simple landscaping */}
      <mesh position={[-4, -1.8, -2]} receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.4]} />
        <meshStandardMaterial color="#228b22" roughness={0.9} metalness={0.0} />
      </mesh>
      
      <mesh position={[4, -1.8, 2]} receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.4]} />
        <meshStandardMaterial color="#228b22" roughness={0.9} metalness={0.0} />
      </mesh>
    </group>
  );
};

const Model3D = ({ url }: { url: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  console.log('🏗️ Model3D: Attempting to load model from URL:', url);

  // Validate URL format first
  const isValidUrl = url && (url.startsWith('http') || url.startsWith('https'));
  if (!isValidUrl) {
    console.error('❌ Invalid model URL:', url);
    if (loadingState !== 'error') {
      setLoadingState('error');
      setErrorMessage('Invalid model URL format');
    }
    return <DefaultScene />;
  }

  // Test model URL accessibility before attempting to load
  useEffect(() => {
    const testModelAccess = async () => {
      try {
        console.log('🔍 Testing model URL accessibility:', url);
        const response = await fetch(url, { method: 'HEAD' });
        console.log('📊 Model URL response:', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          url
        });
        
        if (!response.ok) {
          throw new Error(`Model file not accessible: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error('❌ Model URL accessibility test failed:', err);
        setLoadingState('error');
        setErrorMessage(`Model file not accessible: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setHasError(true);
        return;
      }
    };

    if (url && isValidUrl) {
      testModelAccess();
    }
  }, [url, isValidUrl]);

  let gltf;
  try {
    console.log('📥 useGLTF: Loading model...');
    gltf = useGLTF(url);
    console.log('✅ useGLTF: Model loaded successfully', gltf);
    
    // Set success state when model loads
    if (loadingState !== 'success' && gltf?.scene) {
      setLoadingState('success');
      setHasError(false);
      console.log('🎯 Model scene available:', {
        children: gltf.scene.children.length,
        type: gltf.scene.type,
        userData: gltf.scene.userData
      });
    }
  } catch (err) {
    console.error('❌ useGLTF: Error loading 3D model:', err);
    console.error('❌ Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      url,
      stack: err instanceof Error ? err.stack : undefined
    });
    
    if (loadingState !== 'error') {
      setLoadingState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load 3D model');
      setHasError(true);
    }
  }

  useFrame(() => {
    if (meshRef.current && !hasError && gltf?.scene) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    if (hasError || loadingState === 'error') {
      console.log('🔄 Model3D: Using fallback scene due to error');
      return;
    }

    if (gltf?.scene && loadingState === 'success') {
      try {
        console.log('🎯 Model3D: Processing loaded 3D model scene');
        
        // Clone the scene to avoid modifying the original
        const clonedScene = gltf.scene.clone();
        
        const box = new THREE.Box3().setFromObject(clonedScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('📐 Model dimensions:', {
          size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
          center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) }
        });
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 3 / maxDim : 1;
        
        console.log('🔧 Applying scale factor:', scale.toFixed(2));
        
        clonedScene.scale.setScalar(scale);
        clonedScene.position.sub(center.multiplyScalar(scale));
        clonedScene.position.y = 0; // Ensure model sits on ground
        
        console.log('✅ Model3D: Scene processed successfully');
      } catch (err) {
        console.error('❌ Error processing 3D model scene:', err);
        setHasError(true);
        setLoadingState('error');
        setErrorMessage('Failed to process 3D model geometry');
      }
    }
  }, [gltf, hasError, loadingState]);

  // Show error state with useful information
  if (hasError || loadingState === 'error') {
    console.log('🎭 Showing fallback scene. Error:', errorMessage);
    return (
      <>
        <DefaultScene />
        <Html center>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 max-w-sm">
            <p className="text-destructive text-sm font-medium mb-1">3D Model Load Failed</p>
            <p className="text-destructive/80 text-xs mb-2">{errorMessage}</p>
            <p className="text-muted-foreground text-xs">Using fallback architectural model</p>
          </div>
        </Html>
      </>
    );
  }

  // Show loading state
  if (loadingState === 'loading' || !gltf?.scene) {
    return (
      <>
        <DefaultScene />
        <Html center>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-primary text-sm">Loading 3D model...</span>
            </div>
          </div>
        </Html>
      </>
    );
  }

  // Render the loaded model
  console.log('🎨 Rendering loaded 3D model');
  return gltf?.scene ? (
    <primitive ref={meshRef} object={gltf.scene.clone()} />
  ) : (
    <DefaultScene />
  );
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
  const [sceneReady, setSceneReady] = useState(false);

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
    useEnhancedViewer,
    modelUrl,
    sceneReady
  });

  useEffect(() => {
    // Simulate scene initialization
    const timer = setTimeout(() => {
      setSceneReady(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
          position: [10, 8, 10], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 50%, #B0E0E6 100%)' }}
        shadows={{ enabled: true, type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, alpha: false }}
        onCreated={() => setSceneReady(true)}
      >
        <ambientLight intensity={0.4} color="#ffffff" />
        <directionalLight 
          position={[15, 15, 10]} 
          intensity={1.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-10, 5, -10]} intensity={0.3} color="#fff8dc" />
        <hemisphereLight args={['#87CEEB', '#f0f8ff', 0.3]} />
        
        <Suspense fallback={<LoadingFallback />}>
          {modelUrl && sceneReady ? (
            <Model3D url={modelUrl} />
          ) : (
            <DefaultScene />
          )}
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={50}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
      
      {/* Enhanced 3D Viewer Controls */}
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
            <Box className="h-4 w-4" />
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

      {/* Scene loading indicator */}
      {!sceneReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Initializing 3D scene...</span>
          </div>
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
            {sceneReady && (
              <Badge variant="outline" className="bg-blue-600 text-white">
                Ready
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
              🏠 Showing enhanced architectural model - upload a blueprint to generate a custom 3D model
            </p>
          )}
          {hasElements && !useEnhancedViewer && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseEnhancedViewer(true)}
              >
                <Box className="h-4 w-4 mr-2" />
                Switch to Enhanced BIM Viewer
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
