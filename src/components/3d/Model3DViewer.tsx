
import React, { Suspense, useCallback, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ZoomIn, ZoomOut, Eye, AlertCircle, Package, Box } from "lucide-react";
import { Enhanced3DViewer } from './Enhanced3DViewer';
import { use3DViewer } from '@/hooks/use3DViewer';
import { use3DModelViewer } from '@/hooks/use3DModelViewer';
import * as THREE from 'three';

interface Model3DViewerProps {
  modelUrl?: string;
  modelName?: string;
  uploadId?: string;
  projectId?: string;
  onDownload?: () => void;
  largeViewport?: boolean;
}

const Model3D = ({ url, onError }: { url: string; onError: () => void }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);
  const prevUrlRef = useRef<string | null>(null);
  const { camera, size: canvasSize } = useThree();
  // Set once the loaded model's bounding box is known, then reused by the
  // resize-driven fit effect below (so re-fitting on a canvas resize doesn't
  // need to re-run the material/normalization work every time).
  const fittedRef = useRef<{ maxDim: number; scale: number } | null>(null);

  // Clear stale GLTF cache before loading a new URL to prevent Three.js
  // from serving a cached blob that may have already been revoked.
  useEffect(() => {
    if (prevUrlRef.current && prevUrlRef.current !== url) {
      try {
        useGLTF.clear(prevUrlRef.current);
      } catch (_) { /* ignore */ }
    }
    prevUrlRef.current = url;
  }, [url]);

  // useGLTF participates in Suspense and must always run in the same hook
  // order. Network/parse errors are handled by ModelLoadErrorBoundary below.
  const gltf = useGLTF(url);

  useEffect(() => {
    if (gltf?.scene) {
      try {
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        // Bottom ~15% of the model's height counts as "floor-like" for the
        // per-mesh heuristic below.
        const floorCeilingY = box.min.y + size.y * 0.15;

        // Force opaque rendering and override the surface color/roughness on
        // every mesh WITHOUT its own vertex-color data. Some exports ship no
        // COLOR_0 attribute at all, and their default material came through
        // very dark (near-black), which combined with the scene's lighting
        // made walls unreadable against the background — for those, force a
        // light, neutral surface instead of trusting an absent/near-black
        // base color. Meshes named like a floor/slab, or whose own geometry
        // sits low and flat relative to the whole model, get a slightly
        // different (darker) shade so the floor doesn't visually merge with
        // the walls. Meshes that DO carry real per-vertex colors (e.g. the
        // blueprint pipeline's room/door/wall coloring, verified present via
        // a COLOR_0 attribute on the geometry) keep them untouched — GLTFLoader
        // already wires vertexColors=true for those, matching how the
        // <model-viewer> web component (also three.js-backed) renders them.
        gltf.scene.traverse((child) => {
          if (!(child instanceof THREE.Mesh) || !child.material) return;

          const nameLower = String(child.name || '').toLowerCase();
          const nameLooksLikeFloor = /floor|ground|slab|\bbase\b/.test(nameLower);

          const meshBox = new THREE.Box3().setFromObject(child);
          const meshHeight = meshBox.max.y - meshBox.min.y;
          const meshFootprint = Math.max(
            meshBox.max.x - meshBox.min.x,
            meshBox.max.z - meshBox.min.z
          );
          const geometryLooksLikeFloor =
            meshBox.max.y <= floorCeilingY && meshHeight < meshFootprint * 0.25;
          const surfaceColor = nameLooksLikeFloor || geometryLooksLikeFloor
            ? '#c3c8ce'
            : '#eceef0';
          const hasVertexColors = Boolean(child.geometry?.attributes?.color);

          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            material.transparent = false;
            material.opacity = 1.0;
            material.depthWrite = true;
            material.side = THREE.DoubleSide;

            if (material instanceof THREE.MeshStandardMaterial) {
              material.metalness = 0.0;
              material.roughness = nameLooksLikeFloor || geometryLooksLikeFloor ? 0.95 : 0.8;
              if (hasVertexColors) {
                material.vertexColors = true;
              } else {
                material.vertexColors = false;
                material.color.set(surfaceColor);
              }
            } else if (material instanceof THREE.MeshBasicMaterial) {
              if (hasVertexColors) {
                material.vertexColors = true;
              } else {
                material.vertexColors = false;
                material.color.set(surfaceColor);
              }
            }
            material.needsUpdate = true;
          });
        });

        // Normalized to 6 units (not 3) so the model reads at roughly the same
        // scale as the default camera framing below instead of looking tiny
        // in the middle of the canvas.
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 6 / maxDim : 1;

        gltf.scene.scale.setScalar(scale);
        gltf.scene.position.sub(center.multiplyScalar(scale));

        fittedRef.current = { maxDim, scale };
      } catch (err) {
        console.error('Error processing 3D model:', err);
        setHasError(true);
        onError();
      }
    }
  }, [gltf, onError]);

  // Fit the camera to the model's bounding box whenever the canvas actually
  // resizes — not just once at load — so entering/exiting fullscreen (which
  // swaps in a differently-sized canvas) re-frames the whole plan instead of
  // keeping whatever distance was computed for the old aspect ratio.
  useEffect(() => {
    if (!fittedRef.current || !(camera instanceof THREE.PerspectiveCamera)) return;
    if (canvasSize.width === 0 || canvasSize.height === 0) return;

    const { maxDim, scale } = fittedRef.current;
    const fittedSize = maxDim * scale;
    const halfFovY = (camera.fov * Math.PI) / 360;
    const fitHeightDistance = fittedSize / 2 / Math.tan(halfFovY);
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    // 1.35x padding so the model doesn't touch the edges of the frame.
    const distance = 1.35 * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = new THREE.Vector3(1, 0.65, 1).normalize();
    camera.position.copy(direction.multiplyScalar(distance));
    camera.near = Math.max(0.1, distance / 100);
    camera.far = distance * 100;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, canvasSize.width, canvasSize.height]);

  if (hasError) {
    return null;
  }

  return gltf?.scene ? <primitive ref={meshRef} object={gltf.scene} /> : null;
};

const LoadingFallback = () => (
  <Html center>
    <div className="flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
      <span className="text-sm">Loading 3D model...</span>
    </div>
  </Html>
);

class ModelLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey: string; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Error loading 3D model:', error);
    this.props.onError();
  }

  componentDidUpdate(previousProps: { resetKey: string }) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export const Model3DViewer: React.FC<Model3DViewerProps> = ({ 
  modelUrl, 
  modelName = "3D Model",
  uploadId,
  projectId,
  onDownload,
  largeViewport = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useEnhancedViewer, setUseEnhancedViewer] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const handleModelLoadError = useCallback(() => setModelLoadFailed(true), []);

  // Log the uploadId whenever it changes so we can verify the correct ID is received
  useEffect(() => {
    console.log('Model3DViewer received uploadId:', uploadId);
  }, [uploadId]);

  // When a modelUrl prop is supplied directly (e.g. fresh blob: URL from the
  // pipeline), use it immediately without any DB query.  Only fall back to the
  // DB-polling hook when no direct URL is available.
  const skipDbQuery = Boolean(modelUrl);

  const { 
    model3DUrl: fetchedModelUrl,
    loading: modelDataLoading,
    modelMetadata: fetchedMetadata
  } = use3DModelViewer(skipDbQuery ? undefined : uploadId);

  const { 
    hasElements, 
    elements, 
    feaResults, 
    loading: elementsLoading,
    elementCount 
  } = use3DViewer(uploadId, projectId);

  // Prefer the directly-supplied prop URL; fall back to DB-fetched URL
  const finalModelUrl = modelUrl || fetchedModelUrl;
  const finalModelName = modelName !== "3D Model" ? modelName : (fetchedMetadata?.model_name || "3D Model");
  const isLoading = elementsLoading || (!skipDbQuery && modelDataLoading);

  console.log('Model3DViewer state:', {
    hasElements,
    elementCount,
    isLoading,
    uploadId,
    projectId,
    useEnhancedViewer,
    modelUrl: finalModelUrl,
    sceneReady,
    source: modelUrl ? 'prop (direct)' : 'db-fetch'
  });

  useEffect(() => {
    // Simulate scene initialization
    const timer = setTimeout(() => {
      setSceneReady(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Give a freshly-supplied URL a clean slate instead of carrying over a
  // previous model's load failure.
  useEffect(() => {
    setModelLoadFailed(false);
  }, [finalModelUrl]);

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

  // A model is only "missing" once we're done trying to get one — while a DB
  // lookup is still in flight, that's a loading state, not a not-available state.
  const showEmptyState = sceneReady && (modelLoadFailed || (!finalModelUrl && !isLoading));
  const emptyStateMessage = modelLoadFailed
    ? '3D model failed to load.'
    : isLoading
      ? 'Loading model…'
      : '3D model not available.';

  const viewerContent = (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] h-screen w-screen bg-background pointer-events-auto'
          : largeViewport
            ? 'relative h-[clamp(520px,68vh,760px)] w-full'
            : 'relative w-full aspect-[16/10] min-h-[420px] max-h-[70vh]'
      }
    >
      <Canvas
        camera={{
          position: [8, 6, 8],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
        shadows={{ enabled: true, type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, alpha: false }}
        onCreated={() => setSceneReady(true)}
      >
        {/* Muted dark slate — not pure black, but dark enough that the light
            walls (#eceef0) and floor (#c3c8ce) both read clearly against it. */}
        <color attach="background" args={['#2b3038']} />
        <ambientLight intensity={0.8} color="#ffffff" />
        <directionalLight
          position={[15, 15, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ffffff" />
        <hemisphereLight args={['#ffffff', '#dfe3e6', 0.5]} />

        <Suspense fallback={<LoadingFallback />}>
          {finalModelUrl && sceneReady && !modelLoadFailed ? (
            <ModelLoadErrorBoundary
              resetKey={finalModelUrl}
              onError={handleModelLoadError}
            >
              <Model3D url={finalModelUrl} onError={handleModelLoadError} />
            </ModelLoadErrorBoundary>
          ) : null}
        </Suspense>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={4}
          maxDistance={150}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>

      {showEmptyState && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground px-4">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{emptyStateMessage}</p>
          </div>
        </div>
      )}

      {/* Enhanced 3D Viewer Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
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
        <div className="absolute top-4 left-4 z-10">
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
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Initializing 3D scene...</span>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    // Portal straight to <body> — the results Sheet (and its slide-in animation)
    // establishes its own containing block via CSS transform, which would
    // otherwise confine a `position: fixed` element to the Sheet's panel instead
    // of the real viewport, leaving "fullscreen" visually small.
    return createPortal(viewerContent, document.body);
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            3D Model Viewer
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <Badge variant="secondary" className="max-w-[min(22rem,70vw)] truncate">
              {finalModelName}
            </Badge>
            {isLoading && <Badge variant="outline">Loading...</Badge>}
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
          {!finalModelUrl && !hasElements && !isLoading && (
            <p className="text-blue-600">
              Upload a blueprint to generate a custom 3D model.
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
