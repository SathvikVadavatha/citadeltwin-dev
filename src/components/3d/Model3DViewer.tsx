
import React, { Suspense, useCallback, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useThree } from '@react-three/fiber';
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
  largeViewport?: boolean;
  /** Public URL of the uploaded blueprint image, used by the 2D side of the 2D/3D toggle. */
  blueprintPublicUrl?: string | null;
  dimensions?: DimensionAnnotation[];
  // Room name labels, printed inside the scene at each room's own center —
  // separate from `dimensions` (see RoomNameLabel above).
  roomLabels?: RoomNameLabel[];
  // Optional camera start position override. Defaults to the existing
  // [8, 6, 8] used everywhere today — only the dev verification page
  // (src/pages/DevViewerTest.tsx) passes a different value, for a clearer
  // near-top-down read on dense floor plans.
  cameraPosition?: [number, number, number];
}

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
  onError,
  dimensions = [],
  roomLabels = [],
  showDimensions = false,
}: {
  url: string;
  onError: () => void;
  dimensions?: DimensionAnnotation[];
  roomLabels?: RoomNameLabel[];
  showDimensions?: boolean;
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);
  const [transform, setTransform] = useState<{ scale: number; offset: THREE.Vector3 } | null>(null);
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
        const offset = center.clone().multiplyScalar(scale);

        gltf.scene.scale.setScalar(scale);
        gltf.scene.position.sub(offset);
        setTransform({ scale, offset });

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

  if (!gltf?.scene) {
    return null;
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
  blueprintPublicUrl,
  dimensions = [],
  roomLabels = [],
  cameraPosition = [8, 6, 8],
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useEnhancedViewer, setUseEnhancedViewer] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [showDimensions, setShowDimensions] = useState(false);
  const hasBlueprintImage = Boolean(blueprintPublicUrl);
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
      {viewMode === '2d' ? (
        <div className="flex h-full w-full items-center justify-center bg-muted/20">
          {hasBlueprintImage ? (
            <img
              src={blueprintPublicUrl ?? ''}
              alt={`${finalModelName} blueprint`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground px-4">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">Blueprint image not available.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <Canvas
            camera={{
              position: cameraPosition,
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
                  <Model3D
                    url={finalModelUrl}
                    onError={handleModelLoadError}
                    dimensions={dimensions}
                    roomLabels={roomLabels}
                    showDimensions={showDimensions}
                  />
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

          {/* Scene loading indicator */}
          {!sceneReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Initializing 3D scene...</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enhanced 3D Viewer Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {viewMode === '3d' && (dimensions.length > 0 || roomLabels.length > 0) && (
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
        )}
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
        {viewMode === '3d' && hasElements && (
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
            {isLoading && <Badge variant="outline">Loading...</Badge>}
            {hasElements && (
              <Badge variant="default" className="bg-green-600">
                {elementCount} Elements
              </Badge>
            )}
            <div
              role="group"
              aria-label="View mode"
              className="relative inline-flex h-8 items-center rounded-full border border-border bg-muted/60 p-1 shadow-inner"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-1 left-1 h-6 w-12 rounded-full bg-accent shadow-sm transition-transform duration-300 ease-out"
                style={{ transform: viewMode === '3d' ? 'translateX(3rem)' : 'translateX(0)' }}
              />
              <button
                type="button"
                onClick={() => hasBlueprintImage && setViewMode('2d')}
                disabled={!hasBlueprintImage}
                title={hasBlueprintImage ? undefined : 'No blueprint image available for this project'}
                className={`relative z-10 h-6 w-12 rounded-full text-xs font-semibold transition-colors ${
                  viewMode === '2d' ? 'text-accent-foreground' : 'text-muted-foreground'
                } ${!hasBlueprintImage ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                2D
              </button>
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`relative z-10 h-6 w-12 rounded-full text-xs font-semibold transition-colors ${
                  viewMode === '3d' ? 'text-accent-foreground' : 'text-muted-foreground'
                }`}
              >
                3D
              </button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {viewerContent}
        <div className="mt-4 text-sm text-muted-foreground text-center space-y-2">
          <p>{viewMode === '2d' ? 'Viewing the uploaded blueprint image' : 'Use mouse to rotate, zoom, and pan the 3D model'}</p>
          {!finalModelUrl && !hasElements && !isLoading && (
            <p className="text-blue-600">
              Upload a blueprint to generate a custom 3D model.
            </p>
          )}
          {viewMode === '3d' && hasElements && !useEnhancedViewer && (
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
