
import React, { Suspense, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  AlertCircle,
  Layers,
  Scissors,
  Package,
  Palette,
  Sun,
  Camera,
  RefreshCw
} from "lucide-react";
import * as THREE from 'three';

interface BIMElement {
  id: string;
  name: string;
  element_type: string;
  geometry: any;
  material?: any;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  visible?: boolean;
}

interface FEAResults {
  stress?: { values: number[]; max: number; min: number; unit: string };
  displacement?: { values: number[]; max: number; min: number; unit: string };
  safety_factor?: { values: number[]; max: number; min: number; unit?: string };
}

interface Enhanced3DViewerProps {
  elements: BIMElement[];
  feaResults?: FEAResults;
  onElementSelect?: (elementId: string) => void;
  onDownload?: () => void;
}

const ErrorBoundary = ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('3D Viewer Error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

const BIMElementMesh = ({ 
  element, 
  feaValue, 
  feaType, 
  explodeDistance, 
  isSelected, 
  onClick 
}: { 
  element: BIMElement;
  feaValue?: number;
  feaType?: string;
  explodeDistance: number;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Get color based on FEA results with better normalization
  const getFEAColor = useCallback((value?: number, type?: string, minVal?: number, maxVal?: number) => {
    if (!value || !type || minVal === undefined || maxVal === undefined) return '#4a5568';
    
    // Handle edge case where min equals max
    const range = maxVal - minVal;
    const normalized = range > 0 ? Math.max(0, Math.min(1, (value - minVal) / range)) : 0.5;
    
    switch (type) {
      case 'stress':
        // Blue (low) to Red (high) stress
        return `hsl(${240 - (normalized * 240)}, 70%, 50%)`;
      case 'displacement':
        // Green (low) to Yellow (high) displacement
        return `hsl(${120 - (normalized * 60)}, 70%, 50%)`;
      case 'safety_factor':
        // Red (low) to Green (high) safety factor (inverted)
        return `hsl(${(1 - normalized) * 120}, 70%, 50%)`;
      default:
        return '#4a5568';
    }
  }, []);

  // Calculate exploded position
  const explodedPosition = useCallback(() => {
    const basePos = element.position || [0, 0, 0];
    if (explodeDistance === 0) return basePos;
    
    // Simple explosion based on element center
    const direction = new THREE.Vector3(...basePos).normalize();
    return [
      basePos[0] + direction.x * explodeDistance,
      basePos[1] + direction.y * explodeDistance,
      basePos[2] + direction.z * explodeDistance
    ] as [number, number, number];
  }, [element.position, explodeDistance]);

  // Render different geometries based on element type with better error handling
  const renderGeometry = () => {
    try {
      const color = getFEAColor(feaValue, feaType);
      const material = (
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={isSelected ? 0.8 : (hovered ? 0.9 : 1.0)}
          emissive={isSelected ? color : undefined}
          emissiveIntensity={isSelected ? 0.2 : 0}
          roughness={0.3}
          metalness={0.1}
        />
      );

      const dimensions = element.geometry?.dimensions || {};
      
      switch (element.element_type) {
        case 'wall':
          const wallDims = {
            width: dimensions.width || 2,
            height: dimensions.height || 3,
            thickness: dimensions.thickness || 0.2
          };
          return (
            <Box args={[wallDims.width, wallDims.height, wallDims.thickness]}>
              {material}
            </Box>
          );
        
        case 'beam':
          const beamDims = {
            width: dimensions.width || 0.3,
            height: dimensions.height || 0.5,
            length: dimensions.length || 4
          };
          return (
            <Box args={[beamDims.length, beamDims.height, beamDims.width]}>
              {material}
            </Box>
          );
        
        case 'column':
          const columnDims = {
            diameter: dimensions.diameter || 0.4,
            height: dimensions.height || 3
          };
          return (
            <Cylinder args={[columnDims.diameter/2, columnDims.diameter/2, columnDims.height, 16]}>
              {material}
            </Cylinder>
          );
        
        case 'slab':
          const slabDims = {
            width: dimensions.width || 5,
            length: dimensions.length || 5,
            thickness: dimensions.thickness || 0.2
          };
          return (
            <Box args={[slabDims.width, slabDims.thickness, slabDims.length]}>
              {material}
            </Box>
          );
        
        default:
          return (
            <Box args={[1, 1, 1]}>
              {material}
            </Box>
          );
      }
    } catch (error) {
      console.error('Error rendering geometry for element:', element.id, error);
      return (
        <Box args={[1, 1, 1]}>
          <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
        </Box>
      );
    }
  };

  return (
    <group
      position={explodedPosition()}
      rotation={element.rotation || [0, 0, 0]}
      scale={element.scale || [1, 1, 1]}
      visible={element.visible !== false}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {renderGeometry()}
      {hovered && (
        <Html>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {element.name}
            {feaValue && (
              <div>{feaType}: {feaValue.toFixed(3)}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

const CrossSection = ({ position, normal, enabled }: { 
  position: [number, number, number]; 
  normal: [number, number, number]; 
  enabled: boolean; 
}) => {
  if (!enabled) return null;

  return (
    <group>
      {/* Cross-section plane visualization */}
      <mesh position={position} rotation={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial 
          color="#00ffff" 
          transparent 
          opacity={0.2} 
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Section outline */}
      <Line
        points={[
          [-5, 0, 0], [5, 0, 0], [5, 5, 0], [-5, 5, 0], [-5, 0, 0]
        ]}
        color="#00ffff"
        lineWidth={2}
      />
    </group>
  );
};

const Scene = ({ 
  elements, 
  feaResults, 
  feaType, 
  explodeDistance, 
  selectedElementId, 
  onElementSelect,
  crossSectionEnabled,
  crossSectionPosition,
  lightingIntensity 
}: {
  elements: BIMElement[];
  feaResults?: FEAResults;
  feaType: string;
  explodeDistance: number;
  selectedElementId?: string;
  onElementSelect: (id: string) => void;
  crossSectionEnabled: boolean;
  crossSectionPosition: [number, number, number];
  lightingIntensity: number;
}) => {
  const { scene } = useThree();

  // Memoize FEA values for performance
  const feaData = useMemo(() => {
    if (!feaResults || !feaResults[feaType as keyof FEAResults]) return null;
    return feaResults[feaType as keyof FEAResults];
  }, [feaResults, feaType]);

  // Setup clipping plane for cross-section
  useEffect(() => {
    if (crossSectionEnabled) {
      const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -crossSectionPosition[1]);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              mat.clippingPlanes = [clippingPlane];
              mat.needsUpdate = true;
            });
          } else {
            object.material.clippingPlanes = [clippingPlane];
            object.material.needsUpdate = true;
          }
        }
      });
    } else {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              mat.clippingPlanes = [];
              mat.needsUpdate = true;
            });
          } else {
            object.material.clippingPlanes = [];
            object.material.needsUpdate = true;
          }
        }
      });
    }
  }, [crossSectionEnabled, crossSectionPosition, scene]);

  return (
    <>
      {/* Enhanced lighting setup */}
      <ambientLight intensity={0.4 * lightingIntensity} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1 * lightingIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3 * lightingIntensity} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5 * lightingIntensity}
        castShadow
      />

      {/* BIM Elements with error boundaries */}
      {elements.map((element, index) => {
        const feaValue = feaData?.values?.[index];
        
        return (
          <ErrorBoundary
            key={element.id}
            fallback={
              <Box position={element.position || [index * 2, 0, 0]} args={[1, 1, 1]}>
                <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
              </Box>
            }
          >
            <BIMElementMesh
              element={element}
              feaValue={feaValue}
              feaType={feaType}
              explodeDistance={explodeDistance}
              isSelected={selectedElementId === element.id}
              onClick={() => onElementSelect(element.id)}
            />
          </ErrorBoundary>
        );
      })}

      {/* Cross-section plane */}
      <CrossSection
        position={crossSectionPosition}
        normal={[0, 1, 0]}
        enabled={crossSectionEnabled}
      />

      {/* Grid reference */}
      <gridHelper args={[20, 20, '#444444', '#222222']} />
    </>
  );
};

export const Enhanced3DViewer: React.FC<Enhanced3DViewerProps> = ({ 
  elements, 
  feaResults,
  onElementSelect,
  onDownload 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string>();
  const [activeTab, setActiveTab] = useState("view");
  const [feaType, setFeaType] = useState("stress");
  const [explodeDistance, setExplodeDistance] = useState(0);
  const [crossSectionEnabled, setCrossSectionEnabled] = useState(false);
  const [crossSectionPosition, setCrossSectionPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [lightingIntensity, setLightingIntensity] = useState(1);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleElementSelect = useCallback((elementId: string) => {
    setSelectedElementId(elementId);
    onElementSelect?.(elementId);
  }, [onElementSelect]);

  const selectedElementIndex = useMemo(() => {
    if (!selectedElementId) return undefined;
    return elements.findIndex(el => el.id === selectedElementId);
  }, [selectedElementId, elements]);

  const viewerContent = (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-[600px]'}`}>
      {renderError ? (
        <div className="flex items-center justify-center h-full bg-muted">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">3D Rendering Error</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRenderError(null)}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <ErrorBoundary fallback={
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to render 3D scene</p>
            </div>
          </div>
        }>
          <Canvas
            camera={{ 
              position: [10, 10, 10], 
              fov: 60,
              near: 0.1,
              far: 1000
            }}
            shadows
            gl={{ 
              localClippingEnabled: true,
              antialias: true,
              powerPreference: "high-performance"
            }}
            style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}
            onError={(error) => {
              console.error('Canvas error:', error);
              setRenderError('3D rendering failed');
            }}
          >
            <Suspense fallback={
              <Html center>
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-sm">Loading 3D model...</span>
                </div>
              </Html>
            }>
              <Scene
                elements={elements}
                feaResults={feaResults}
                feaType={feaType}
                explodeDistance={explodeDistance}
                selectedElementId={selectedElementId}
                onElementSelect={handleElementSelect}
                crossSectionEnabled={crossSectionEnabled}
                crossSectionPosition={crossSectionPosition}
                lightingIntensity={lightingIntensity}
              />
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={100}
              maxPolarAngle={Math.PI}
              dampingFactor={0.05}
              enableDamping={true}
            />
          </Canvas>
        </ErrorBoundary>
      )}
      
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
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
    return (
      <div className="fixed inset-0 z-50 bg-background flex">
        {viewerContent}
        {/* Fullscreen controls panel */}
        <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
          <ViewControls
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            feaType={feaType}
            setFeaType={setFeaType}
            explodeDistance={explodeDistance}
            setExplodeDistance={setExplodeDistance}
            crossSectionEnabled={crossSectionEnabled}
            setCrossSectionEnabled={setCrossSectionEnabled}
            crossSectionPosition={crossSectionPosition}
            setCrossSectionPosition={setCrossSectionPosition}
            lightingIntensity={lightingIntensity}
            setLightingIntensity={setLightingIntensity}
            elements={elements}
            selectedElementId={selectedElementId}
            feaResults={feaResults}
          />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Enhanced 3D BIM Viewer
          </div>
          <Badge variant="secondary">{elements.length} Elements</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewerContent}
        
        <ViewControls
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          feaType={feaType}
          setFeaType={setFeaType}
          explodeDistance={explodeDistance}
          setExplodeDistance={setExplodeDistance}
          crossSectionEnabled={crossSectionEnabled}
          setCrossSectionEnabled={setCrossSectionEnabled}
          crossSectionPosition={crossSectionPosition}
          setCrossSectionPosition={setCrossSectionPosition}
          lightingIntensity={lightingIntensity}
          setLightingIntensity={setLightingIntensity}
          elements={elements}
          selectedElementId={selectedElementId}
          feaResults={feaResults}
        />
      </CardContent>
    </Card>
  );
};

const ViewControls = ({ 
  activeTab, setActiveTab, feaType, setFeaType, explodeDistance, setExplodeDistance,
  crossSectionEnabled, setCrossSectionEnabled, crossSectionPosition, setCrossSectionPosition,
  lightingIntensity, setLightingIntensity, elements, selectedElementId, feaResults 
}: any) => (
  <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="view" className="flex items-center gap-1">
        <Eye className="w-3 h-3" />
        View
      </TabsTrigger>
      <TabsTrigger value="fea" className="flex items-center gap-1">
        <Palette className="w-3 h-3" />
        FEA
      </TabsTrigger>
      <TabsTrigger value="section" className="flex items-center gap-1">
        <Scissors className="w-3 h-3" />
        Section
      </TabsTrigger>
      <TabsTrigger value="lighting" className="flex items-center gap-1">
        <Sun className="w-3 h-3" />
        Lighting
      </TabsTrigger>
    </TabsList>

    <TabsContent value="view" className="space-y-4">
      <div>
        <label className="text-sm font-medium">Exploded View</label>
        <Slider
          value={[explodeDistance]}
          onValueChange={(value) => setExplodeDistance(value[0])}
          max={10}
          step={0.1}
          className="mt-2"
        />
        <span className="text-xs text-muted-foreground">Distance: {explodeDistance.toFixed(1)}</span>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Elements ({elements.length})</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {elements.map((element: BIMElement) => (
            <div
              key={element.id}
              className={`p-2 text-xs rounded cursor-pointer ${
                selectedElementId === element.id ? 'bg-primary/20' : 'bg-muted/50'
              }`}
            >
              <div className="font-medium">{element.name}</div>
              <div className="text-muted-foreground">{element.element_type}</div>
            </div>
          ))}
        </div>
      </div>
    </TabsContent>

    <TabsContent value="fea" className="space-y-4">
      <div>
        <label className="text-sm font-medium">Analysis Type</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {['stress', 'displacement', 'safety_factor'].map((type) => (
            <Button
              key={type}
              size="sm"
              variant={feaType === type ? "default" : "outline"}
              onClick={() => setFeaType(type)}
              className="text-xs"
            >
              {type.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>
      
      {feaResults && (
        <div>
          <h4 className="font-medium mb-2">Results Range</h4>
          <div className="text-xs space-y-1">
            <div>Max: {feaResults[feaType as keyof FEAResults]?.max?.toExponential(2) || 'N/A'}</div>
            <div>Min: {feaResults[feaType as keyof FEAResults]?.min?.toExponential(2) || 'N/A'}</div>
          </div>
        </div>
      )}
    </TabsContent>

    <TabsContent value="section" className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          checked={crossSectionEnabled}
          onCheckedChange={setCrossSectionEnabled}
        />
        <label className="text-sm font-medium">Enable Cross-Section</label>
      </div>
      
      {crossSectionEnabled && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Y Position</label>
            <Slider
              value={[crossSectionPosition[1]]}
              onValueChange={(value) => setCrossSectionPosition([0, value[0], 0])}
              min={-10}
              max={10}
              step={0.1}
              className="mt-2"
            />
            <span className="text-xs text-muted-foreground">Y: {crossSectionPosition[1].toFixed(1)}</span>
          </div>
        </div>
      )}
    </TabsContent>

    <TabsContent value="lighting" className="space-y-4">
      <div>
        <label className="text-sm font-medium">Lighting Intensity</label>
        <Slider
          value={[lightingIntensity]}
          onValueChange={(value) => setLightingIntensity(value[0])}
          min={0.1}
          max={3}
          step={0.1}
          className="mt-2"
        />
        <span className="text-xs text-muted-foreground">Intensity: {lightingIntensity.toFixed(1)}</span>
      </div>
    </TabsContent>
  </Tabs>
);
