
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF, Line } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ZoomIn, ZoomOut, Eye, AlertCircle, Package, Box, Ruler } from "lucide-react";
import { Enhanced3DViewer } from './Enhanced3DViewer';
import { use3DViewer } from '@/hooks/use3DViewer';
import { use3DModelViewer } from '@/hooks/use3DModelViewer';
import * as THREE from 'three';

export interface DimensionPoint {
  x: number;
  y: number;
  z: number;
}

// Schema matching blueprint-pipeline's stage5_export.py output: `position`
// is always the label anchor (the midpoint of the span, when there is one).
// `line_start`/`line_end` are present only on entries that measure an actual
// physical span (room_width, room_height, wall_length) — the two endpoints
// of the same edge the label's number was computed from. `room_area` never
// carries a line, since an area doesn't correspond to one edge.
export interface DimensionAnnotation {
  position: DimensionPoint;
  label: string;
  kind: 'room_width' | 'room_height' | 'room_area' | 'wall_length' | string;
  line_start?: DimensionPoint;
  line_end?: DimensionPoint;
}

const isValidPoint = (p: unknown): p is DimensionPoint =>
  !!p && typeof p === 'object' &&
  typeof (p as DimensionPoint).x === 'number' &&
  typeof (p as DimensionPoint).y === 'number' &&
  typeof (p as DimensionPoint).z === 'number';

// Room name label — a completely separate kind of in-scene label from
// DimensionAnnotation. Sourced from the same `rooms` data (label + center)
// already used to build the Rooms & Square Footage table, not from the
// `dimensions` array, so it never counts toward the dimension label count
// and is unaffected by any dimension-side filtering (e.g. the dev harness's
// perimeter-only wall toggle only ever filters `dimensions`, never this).
export interface RoomNameLabel {
  label: string;
  center: { x: number; y: number };
  // Optional pre-formatted area text (e.g. "182 sq ft"), rendered stacked
  // just below the room name in the same leader-line callout, replacing the
  // old on-anchor `room_area` dimension label (see DimensionsOverlay).
  areaLabel?: string;
}

interface Model3DViewerProps {
  modelUrl?: string;
  modelName?: string;
  uploadId?: string;
  projectId?: string;
  onDownload?: () => void;
  dimensions?: DimensionAnnotation[];
  // Room name labels, printed inside the scene at each room's own center —
  // separate from `dimensions` (see RoomNameLabel above).
  roomLabels?: RoomNameLabel[];
  // Optional camera start position override. Defaults to the existing
  // isometric-ish [10, 8, 10] used everywhere today — only the dev
  // verification page (src/pages/DevViewerTest.tsx) passes a different
  // value, for a clearer near-top-down read on dense floor plans.
  cameraPosition?: [number, number, number];
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
      
      {/* Roof */}
      <mesh position={[0, 2.25, 0]} castShadow>
        <coneGeometry args={[3.8, 1.5, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} metalness={0.0} />
      </mesh>
      
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

// Each dimension is a label at `position`, plus — for entries measuring an
// actual span (room_width, room_height, wall_length) — a plain straight
// line between `line_start`/`line_end`. No tick marks, no perpendicular
// offset geometry like the earlier version had. `room_area` never has a
// line, since an area doesn't correspond to one edge.
//
// Entries with a missing/malformed `position` (or, for spans, a missing
// line_start/line_end) are skipped rather than crashing the whole overlay —
// `transformPoint` indexes straight into `.x`/`.y`/`.z`, so a malformed
// entry previously threw "Cannot read properties of undefined" from inside
// the .map() and took down the entire component.
const DimensionsOverlay = ({
  dimensions,
  transform
}: {
  dimensions: DimensionAnnotation[];
  transform: { scale: number; offset: THREE.Vector3 };
}) => {
  const transformPoint = (p: DimensionPoint): [number, number, number] => [
    p.x * transform.scale - transform.offset.x,
    p.y * transform.scale - transform.offset.y,
    p.z * transform.scale - transform.offset.z
  ];

  return (
    <group name="dimensions-overlay">
      {dimensions.map((dim, idx) => {
        // room_area is rendered by RoomNameOverlay's leader-line callout
        // instead (paired with the room's own name, offset together into
        // open space) — skip it here so it isn't drawn twice, once on-anchor
        // (colliding with everything else at that same point) and once
        // properly offset.
        if (dim?.kind === 'room_area') {
          return null;
        }
        if (!isValidPoint(dim?.position)) {
          console.warn('DimensionsOverlay: skipping entry with invalid position', {
            index: idx, kind: dim?.kind, label: dim?.label, position: dim?.position,
            line_start: dim?.line_start, line_end: dim?.line_end,
          });
          return null;
        }

        const pos = transformPoint(dim.position);
        const isRoom = dim.kind.startsWith('room');
        const textColor = isRoom ? '#f5d76e' : '#ffffff';

        const hasLine = dim.kind !== 'room_area' && isValidPoint(dim.line_start) && isValidPoint(dim.line_end);
        if ((dim.kind === 'room_width' || dim.kind === 'room_height' || dim.kind === 'wall_length')
            && (dim.line_start || dim.line_end) && !hasLine) {
          // Only one of the pair present, or malformed — log and fall back
          // to label-only rather than crashing.
          console.warn('DimensionsOverlay: entry expected a line but line_start/line_end is incomplete', {
            index: idx, kind: dim.kind, label: dim.label, line_start: dim.line_start, line_end: dim.line_end,
          });
        }

        return (
          <group key={`dim-${idx}-${dim.label}-${dim.kind}`}>
            {hasLine && (
              <Line
                points={[transformPoint(dim.line_start as DimensionPoint), transformPoint(dim.line_end as DimensionPoint)]}
                color={isRoom ? '#f5d76e' : '#ffffff'}
                lineWidth={1.5}
              />
            )}
            <Html position={pos} center zIndexRange={[100, 0]}>
            <div
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide whitespace-nowrap shadow-sm pointer-events-none select-none"
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                color: textColor,
                border: `1px solid ${isRoom ? '#f5d76e40' : '#ffffff30'}`,
                backdropFilter: 'blur(2px)',
              }}
            >
              {dim.label}
            </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// Room name labels — printed inside the scene near each room's own center,
// like a real floor plan prints a room's name inside that room. Deliberately
// separate from DimensionsOverlay/`dimensions`: sourced from `roomLabels`
// (built from the same `rooms` data as the Rooms & Square Footage table),
// so it never adds to the dimension label count and is untouched by any
// dimension-side filtering (e.g. the dev harness's perimeter-only toggle
// only ever filters the `dimensions` array passed in — this prop is separate
// and always renders whenever dimensions are shown).
//
// Renders as a leader-line callout rather than directly on the room's
// position: a small dot marks the room's real center exactly, a thin line
// connects it to the label, and the label itself sits offset into open
// space. On a floor plan with several small adjacent rooms (e.g. a
// balcony/closet/bathroom cluster), placing labels directly on-position
// made them collide and stack illegibly. The offset direction for each room
// is computed radially outward from the floor plan's own centroid, with
// near-duplicate angles fanned apart, so nearby rooms' callouts point in
// different directions instead of all defaulting to the same spot.
const ROOM_NAME_Z = 0.15; // matches the floor-level z stage5_export.py uses for dimension labels
const CALLOUT_BASE_DISTANCE_PX = 70;
const CALLOUT_DISTANCE_STEP_PX = 32; // extra distance per tier, staggered below
const CALLOUT_MIN_ANGLE_GAP_RAD = (30 * Math.PI) / 180;

function computeCalloutOffsets(centers: { x: number; y: number }[]): { dx: number; dy: number }[] {
  const n = centers.length;
  if (n === 0) return [];

  const cx = centers.reduce((sum, c) => sum + c.x, 0) / n;
  const cy = centers.reduce((sum, c) => sum + c.y, 0) / n;

  // Angle of each room relative to the overall floor-plan centroid — rooms
  // spread around the plan naturally point their callouts in different
  // directions (a room on the left points left, one on the right points
  // right, etc.), the same radial-labeling technique maps use.
  const withAngle = centers.map((c, i) => {
    const dx = c.x - cx;
    const dy = c.y - cy;
    const r = Math.hypot(dx, dy);
    // A room sitting exactly on the centroid has no defined direction —
    // fall back to spreading those evenly around the circle by index.
    const angle = r < 1e-6 ? (i / n) * Math.PI * 2 : Math.atan2(dy, dx);
    return { i, angle };
  });

  // Decluster: rooms whose angle is nearly identical (e.g. two small rooms
  // right next to each other, both on the same side of the plan) would
  // still point their callouts at each other and collide — fan those apart
  // by a minimum angular gap, processing in angle order. Whenever a room's
  // angle had to be pushed to make room, also bump it out to the next
  // distance tier — two labels that are angularly close but at different
  // distances from the anchor cluster are far less likely to overlap than
  // two at the same distance, even with a full angular gap between them
  // (labels are wide relative to the gap at a fixed short distance).
  withAngle.sort((a, b) => a.angle - b.angle);
  let lastAngle = -Infinity;
  let tier = 0;
  const tiers: number[] = new Array(n);
  for (const item of withAngle) {
    if (item.angle - lastAngle < CALLOUT_MIN_ANGLE_GAP_RAD) {
      item.angle = lastAngle + CALLOUT_MIN_ANGLE_GAP_RAD;
      tier = (tier + 1) % 3;
    } else {
      tier = 0;
    }
    tiers[item.i] = tier;
    lastAngle = item.angle;
  }

  const result: { dx: number; dy: number }[] = new Array(n);
  for (const item of withAngle) {
    const distance = CALLOUT_BASE_DISTANCE_PX + tiers[item.i] * CALLOUT_DISTANCE_STEP_PX;
    result[item.i] = {
      dx: Math.cos(item.angle) * distance,
      dy: Math.sin(item.angle) * distance,
    };
  }
  return result;
}

const RoomNameOverlay = ({
  roomLabels,
  transform
}: {
  roomLabels: RoomNameLabel[];
  transform: { scale: number; offset: THREE.Vector3 };
}) => {
  const transformPoint = (x: number, y: number): [number, number, number] => [
    x * transform.scale - transform.offset.x,
    y * transform.scale - transform.offset.y,
    ROOM_NAME_Z * transform.scale - transform.offset.z
  ];

  const validRooms = roomLabels.filter(
    (room) => room?.center && typeof room.center.x === 'number' && typeof room.center.y === 'number' && !!room.label
  );
  const offsets = computeCalloutOffsets(validRooms.map((r) => r.center));

  return (
    <group name="room-name-overlay">
      {validRooms.map((room, idx) => {
        const pos = transformPoint(room.center.x, room.center.y);
        const { dx, dy } = offsets[idx];
        const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        const dist = Math.hypot(dx, dy);

        return (
          // No `center` prop here (unlike DimensionsOverlay): this Html's
          // local (0,0) needs to sit exactly at the projected anchor point
          // so the dot/line/label below can be positioned relative to it
          // with plain absolute CSS offsets.
          <Html key={`room-name-${idx}-${room.label}`} position={pos} zIndexRange={[101, 0]}>
            <div style={{ position: 'relative', width: 0, height: 0 }}>
              {/* Anchor dot — marks the room's real center exactly */}
              <div
                style={{
                  position: 'absolute', left: -3, top: -3, width: 6, height: 6,
                  borderRadius: '50%', background: '#ffffff', border: '1px solid rgba(0,0,0,0.6)',
                  pointerEvents: 'none',
                }}
              />
              {/* Leader line — connects the anchor to the offset label */}
              <div
                style={{
                  position: 'absolute', left: 0, top: 0, width: dist, height: 1,
                  background: 'rgba(255,255,255,0.85)', transformOrigin: '0 0',
                  transform: `rotate(${angleDeg}deg)`, pointerEvents: 'none',
                }}
              />
              {/* Offset label group — name stacked above its area */}
              <div
                style={{
                  position: 'absolute', left: dx, top: dy, transform: 'translate(-50%, -50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}
              >
                <div
                  className="px-2 py-0.5 rounded text-xs font-bold tracking-wider whitespace-nowrap shadow-sm pointer-events-none select-none uppercase"
                  style={{
                    background: 'rgba(0, 0, 0, 0.75)',
                    color: '#ffffff',
                    border: '1px solid #ffffff60',
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  {room.label}
                </div>
                {room.areaLabel && (
                  <div
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide whitespace-nowrap shadow-sm pointer-events-none select-none"
                    style={{
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#f5d76e',
                      border: '1px solid #f5d76e40',
                      backdropFilter: 'blur(2px)',
                    }}
                  >
                    {room.areaLabel}
                  </div>
                )}
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
};

const Model3D = ({
  url,
  dimensions = [],
  roomLabels = [],
  showDimensions = false
}: {
  url: string;
  dimensions?: DimensionAnnotation[];
  roomLabels?: RoomNameLabel[];
  showDimensions?: boolean;
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);
  const [transform, setTransform] = useState<{ scale: number; offset: THREE.Vector3 } | null>(null);
  const prevUrlRef = useRef<string | null>(null);

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

  let gltf;
  let loadError = false;

  try {
    gltf = useGLTF(url);
  } catch (err) {
    // useGLTF is Suspense-integrated: while the resource is still loading it
    // deliberately throws the pending Promise so the nearest <Suspense>
    // boundary can catch it and show LoadingFallback. This try/catch used to
    // swallow that throw unconditionally and treat it as a load failure —
    // meaning on first render (before anything was cached) it *always* fell
    // back to the placeholder cottage scene instead of ever actually
    // rendering a real generated model. Re-throw pending promises so
    // Suspense still gets them; only treat genuine Error objects (e.g. a
    // malformed GLB) as a real load failure.
    if (err instanceof Promise) {
      throw err;
    }
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
        // trimesh exports GLB with real per-vertex RGBA color data but no
        // explicit material opacity settings, causing Three.js to default to
        // semi-transparent blue. We used to force every mesh fully opaque
        // and gate vertex-color rendering on `material.vertexColors`, but
        // standard GLTF loaders never set that flag to true on their own
        // even when the geometry carries real COLOR_0 data — so that check
        // was always false, meaning colored geometry likely never rendered
        // its intended per-vertex colors here. Instead, read the geometry's
        // own color attribute directly, and decide transparency per mesh
        // from its actual alpha value (e.g. window panes, which are
        // deliberately exported translucent) rather than forcing every
        // mesh — including intentionally translucent ones — to opaque.
        //
        // Also found while building the dev verification harness: trimesh's
        // default exported material is fully metallic (metalness=1) with no
        // environment map. A fully metallic PBR material has near-zero
        // diffuse reflectance and relies on specular/IBL reflections for any
        // visible color — under this scene's plain point/directional lights
        // (no envMap) that rendered every mesh as solid black regardless of
        // its vertex color, which is why the model appeared to not render at
        // all. Forcing metalness to 0 here (architectural surfaces — walls,
        // tiles, doors, windows — aren't metal anyway) restores a normal
        // diffuse response so vertex colors are actually visible.
        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.material) {
            const colorAttr = child.geometry?.attributes?.color;
            let alpha = 1.0;

            if (colorAttr) {
              child.material.vertexColors = true;
              if (colorAttr.itemSize >= 4 && colorAttr.count > 0) {
                // colorAttr.getW() returns the RAW stored value, not a
                // normalized 0..1 float — for a normalized Uint8Array
                // (trimesh's default COLOR_0 export) that's an integer
                // 0-255, so it must be divided down before comparing
                // against an 0..1 alpha threshold below.
                const raw = colorAttr.array[3];
                alpha = colorAttr.normalized ? raw / 255 : raw;
              }
            }

            child.material.metalness = 0;
            const isTranslucent = alpha < 0.98;
            child.material.transparent = isTranslucent;
            child.material.opacity = isTranslucent ? alpha : 1.0;
            child.material.depthWrite = !isTranslucent;
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        });

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 3 / maxDim : 1;
        const offset = center.clone().multiplyScalar(scale);

        gltf.scene.scale.setScalar(scale);
        gltf.scene.position.sub(offset);
        setTransform({ scale, offset });
      } catch (err) {
        console.error('Error processing 3D model:', err);
        setHasError(true);
      }
    }
  }, [gltf, loadError]);

  if (hasError || loadError) {
    return <DefaultScene />;
  }

  if (!gltf?.scene) {
    return <DefaultScene />;
  }

  return (
    <group ref={meshRef}>
      <primitive object={gltf.scene} />
      {showDimensions && transform && dimensions && dimensions.length > 0 && (
        <DimensionsOverlay dimensions={dimensions} transform={transform} />
      )}
      {showDimensions && transform && roomLabels && roomLabels.length > 0 && (
        <RoomNameOverlay roomLabels={roomLabels} transform={transform} />
      )}
    </group>
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
  onDownload,
  dimensions = [],
  roomLabels = [],
  cameraPosition = [10, 8, 10]
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useEnhancedViewer, setUseEnhancedViewer] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);

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
          position: cameraPosition,
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
          {finalModelUrl && sceneReady ? (
            <Model3D url={finalModelUrl} dimensions={dimensions} roomLabels={roomLabels} showDimensions={showDimensions} />
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
          variant={showDimensions ? "default" : "outline"}
          size="sm"
          onClick={() => setShowDimensions(!showDimensions)}
          className={`bg-background/80 backdrop-blur-sm flex items-center gap-1.5 ${
            showDimensions ? 'bg-primary text-primary-foreground' : ''
          }`}
          title="Toggle Dimensions Overlay"
        >
          <Ruler className="h-4 w-4" />
          <span className="text-xs font-medium hidden sm:inline">Dimensions</span>
        </Button>
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
            <Badge variant="secondary">{finalModelName}</Badge>
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
          {!finalModelUrl && !hasElements && (
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
