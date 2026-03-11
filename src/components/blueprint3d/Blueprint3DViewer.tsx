import React, { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Grid, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw, Home, Maximize2, Box, BedDouble, Bath, CookingPot, DoorOpen, Sofa, UtensilsCrossed, Briefcase, Car, LayoutGrid } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { ProcessingResult } from './BlueprintTo3DConverter';
import * as THREE from 'three';

interface Blueprint3DViewerProps {
  result: ProcessingResult;
  onReset: () => void;
}

// Per-room color map matching the edge function
const ROOM_COLORS: Record<string, string> = {
  bedroom: '#78B6E8', master_bedroom: '#4582D1', bathroom: '#38C0CC',
  kitchen: '#F2C42E', living_room: '#59BF82', dining_room: '#E87F37',
  office: '#9470DB', garage: '#9999A0', hallway: '#D1D1CC',
  foyer: '#E6C78E', pantry: '#CCAA59', closet: '#D9C7EB',
  laundry: '#73D9E6', porch: '#8CD173', storage: '#B3AFA5',
  utility: '#B8945B',
};

function getRoomColor(label: string): string {
  const key = (label || '').toLowerCase().replace(/[\s_]+/g, '_').replace('space_', '');
  return ROOM_COLORS[key] || '#A0A0A0';
}

const GLBModel: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);
  // Center the model
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  scene.position.sub(center);
  scene.position.y = 0;
  return <primitive object={scene} />;
};

const LoadingModel: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center gap-3">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">Loading 3D model…</p>
  </div>
);

const CameraRig: React.FC = () => {
  return null; // OrbitControls handles it
};

export const Blueprint3DViewer: React.FC<Blueprint3DViewerProps> = ({ result, onReset }) => {
  const [activeTab, setActiveTab] = useState<'3d' | '2d'>('3d');
  const [bgMode, setBgMode] = useState<'dark' | 'light'>('dark');
  const orbitRef = useRef<any>(null);

  const resetCamera = () => {
    orbitRef.current?.reset();
  };

  const totalArea = result.detections.reduce((sum, d) => {
    return sum + (parseFloat(d.area_m2) || 0);
  }, 0);

  // Build room type counts
  const roomCounts: Record<string, number> = {};
  result.detections.forEach((d) => {
    const type = (d.label || '').toLowerCase().replace(/[\s]+/g, '_');
    roomCounts[type] = (roomCounts[type] || 0) + 1;
  });

  const bedrooms = (roomCounts['bedroom'] || 0) + (roomCounts['master_bedroom'] || 0);
  const bathrooms = roomCounts['bathroom'] || 0;
  const kitchens = roomCounts['kitchen'] || 0;
  const livingRooms = roomCounts['living_room'] || 0;
  const diningRooms = roomCounts['dining_room'] || 0;
  const garages = roomCounts['garage'] || 0;
  const offices = roomCounts['office'] || 0;

  const totalAreaSqft = result.building_info?.total_area_sqft
    ? result.building_info.total_area_sqft
    : (totalArea * 10.764).toFixed(0);

  const buildingType = result.building_info?.building_type || 'Residential';
  const numFloors = result.building_info?.num_floors || 1;

  // Build a concise summary line
  const summaryParts: string[] = [];
  if (bedrooms > 0) summaryParts.push(`${bedrooms} Bed`);
  if (bathrooms > 0) summaryParts.push(`${bathrooms} Bath`);
  if (kitchens > 0) summaryParts.push(`${kitchens} Kitchen`);
  const summaryLine = summaryParts.length > 0 ? summaryParts.join(' · ') : `${result.detections.length} Rooms`;

  // Other rooms not in the main summary
  const otherRoomTypes = Object.entries(roomCounts).filter(
    ([type]) => !['bedroom', 'master_bedroom', 'bathroom', 'kitchen'].includes(type)
  );
        <div className="flex items-center gap-2">
          <Button onClick={onReset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1.5" />
            New Blueprint
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as '3d' | '2d')}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="3d" className="gap-1.5"><Box className="h-3.5 w-3.5" />3D Viewer</TabsTrigger>
          <TabsTrigger value="2d" className="gap-1.5"><Home className="h-3.5 w-3.5" />Floor Plan</TabsTrigger>
        </TabsList>

        {/* ===== 3D TAB ===== */}
        <TabsContent value="3d" className="space-y-3 mt-3">
          <div className="relative rounded-xl overflow-hidden border border-border shadow-lg" style={{ height: 580 }}>

            {/* Controls bar */}
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <Button
                size="sm" variant="secondary"
                className="h-8 text-xs shadow"
                onClick={() => setBgMode(m => m === 'dark' ? 'light' : 'dark')}
              >
                {bgMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </Button>
              <Button
                size="sm" variant="secondary"
                className="h-8 text-xs shadow"
                onClick={resetCamera}
              >
                <Maximize2 className="h-3.5 w-3.5 mr-1" />Reset View
              </Button>
            </div>

            <Canvas
              gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
              shadows
            >
              <PerspectiveCamera makeDefault position={[14, 12, 14]} fov={45} />
              
              {/* Lighting */}
              <ambientLight intensity={bgMode === 'dark' ? 0.4 : 0.7} />
              <directionalLight
                position={[15, 20, 10]}
                intensity={bgMode === 'dark' ? 1.8 : 1.4}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={0.1}
                shadow-camera-far={100}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
              />
              <directionalLight position={[-10, 8, -10]} intensity={0.4} />
              <pointLight position={[0, 8, 0]} intensity={0.5} color="#fff8e7" />

              {/* Background */}
              <color attach="background" args={[bgMode === 'dark' ? '#0f172a' : '#e8edf5']} />
              {bgMode === 'light' && <fog attach="fog" args={['#e8edf5', 30, 80]} />}

              {/* Ground grid */}
              <Grid
                args={[50, 50]}
                cellSize={1}
                cellThickness={0.5}
                cellColor={bgMode === 'dark' ? '#334155' : '#cbd5e1'}
                sectionSize={5}
                sectionThickness={1}
                sectionColor={bgMode === 'dark' ? '#475569' : '#94a3b8'}
                fadeDistance={40}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid
              />

              {/* Contact shadows for realism */}
              <ContactShadows
                position={[0, -0.01, 0]}
                opacity={bgMode === 'dark' ? 0.6 : 0.35}
                scale={30}
                blur={2.5}
                far={10}
              />

              <Suspense fallback={null}>
                <GLBModel url={result.glb_url} />
              </Suspense>

              <OrbitControls
                ref={orbitRef}
                makeDefault
                enableDamping
                dampingFactor={0.07}
                minDistance={3}
                maxDistance={60}
                maxPolarAngle={Math.PI / 1.9}
              />
            </Canvas>

            {/* Loading overlay */}
            <div
              id="canvas-loader"
              className="absolute inset-0 bg-background/80 flex items-center justify-center pointer-events-none"
              style={{ display: 'none' }}
            />
          </div>

          <p className="text-xs text-muted-foreground pl-1">
            🖱 Drag to rotate · Scroll to zoom · Right-click to pan · Each color = distinct room type
          </p>

          {/* Room legend */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              Detected Rooms
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {result.detections.map((d, idx) => {
                const roomType = (d.label || d.class || '').replace('space_', '');
                const color = getRoomColor(roomType);
                return (
                  <div key={idx} className="flex items-start gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0 border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate leading-tight">{d.name || roomType}</div>
                      <div className="text-xs text-muted-foreground">{d.width_m}×{d.depth_m}m</div>
                      <div className="text-xs text-muted-foreground/70">{d.area_m2} m²</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ===== 2D TAB ===== */}
        <TabsContent value="2d" className="mt-3">
          <div className="rounded-xl overflow-auto border border-border bg-[#1a1a2e]">
            <div
              dangerouslySetInnerHTML={{ __html: result.html_view }}
              className="min-h-[500px]"
            />
          </div>
          <p className="text-xs text-muted-foreground pl-1 mt-2">
            Hover over rooms to see dimensions. Colors match the 3D model.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
