import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Grid, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, RotateCcw, Home, Maximize2, Box, BedDouble, Bath, CookingPot, DoorOpen, Sofa, UtensilsCrossed, Briefcase, Car, LayoutGrid, ShowerHead, WashingMachine, TreePine, Warehouse, Wrench, Archive, Square, Ruler, Scale, Layers, Info } from 'lucide-react';
import type { ProcessingResult } from './BlueprintTo3DConverter';
import * as THREE from 'three';

// Security: Sanitize HTML to prevent XSS from API responses
const sanitizeHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Remove all script tags, event handlers, and dangerous elements
  const scripts = doc.querySelectorAll('script, iframe, object, embed, form, link[rel="import"]');
  scripts.forEach(el => el.remove());
  // Remove event handler attributes from all elements
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const attrs = Array.from(el.attributes);
    attrs.forEach(attr => {
      if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
    // Remove dangerous href/src values
    if (el.hasAttribute('href') && el.getAttribute('href')?.toLowerCase().startsWith('javascript:')) {
      el.removeAttribute('href');
    }
    if (el.hasAttribute('src') && el.getAttribute('src')?.toLowerCase().startsWith('javascript:')) {
      el.removeAttribute('src');
    }
  });
  return doc.body.innerHTML;
};

interface Blueprint3DViewerProps {
  result: ProcessingResult;
  onReset: () => void;
}

const ROOM_COLORS: Record<string, string> = {
  bedroom: '#78B6E8', master_bedroom: '#4582D1', bathroom: '#38C0CC',
  kitchen: '#F2C42E', living_room: '#59BF82', living: '#59BF82',
  dining_room: '#E87F37', dining: '#E87F37',
  office: '#9470DB', study: '#9470DB',
  garage: '#9999A0', hallway: '#D1D1CC', corridor: '#D1D1CC',
  foyer: '#E6C78E', entry: '#E6C78E', pantry: '#CCAA59',
  closet: '#D9C7EB', walk_in_closet: '#C4A8E0', 'walk-in_closet': '#C4A8E0',
  laundry: '#73D9E6', porch: '#8CD173', balcony: '#8CD173',
  storage: '#B3AFA5', utility: '#B8945B', mechanical: '#B8945B',
  mech: '#B8945B', den: '#C49A6C', sunroom: '#E6D44D',
  mudroom: '#A0886B', powder_room: '#88CCDD', loft: '#CC9966',
};

function getRoomColor(label: string): string {
  const key = (label || '').toLowerCase().replace(/[\s_]+/g, '_').replace('space_', '');
  return ROOM_COLORS[key] || '#A0A0A0';
}

const GLBModel: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  scene.position.sub(center);
  scene.position.y = 0;
  return <primitive object={scene} />;
};

export const Blueprint3DViewer: React.FC<Blueprint3DViewerProps> = ({ result, onReset }) => {
  const [activeTab, setActiveTab] = useState<'3d' | '2d'>('3d');
  const [bgMode, setBgMode] = useState<'dark' | 'light'>('dark');
  const orbitRef = useRef<any>(null);
  const dimensionsAvailable = result.dimensions_available !== false;

  const resetCamera = () => { orbitRef.current?.reset(); };

  const totalArea = dimensionsAvailable ? result.detections.reduce((sum, d) => sum + (parseFloat(d.area_m2) || 0), 0) : 0;

  const normalizeRoomType = (label: string): string => {
    let l = (label || '').toLowerCase().replace(/^space_/, '').replace(/[\s-]+/g, '_');
    if (/master.*bed|bed.*room|bedroom|master_bed/.test(l)) return 'bedroom';
    if (/bath|powder_room|shower/.test(l)) return 'bathroom';
    if (/kitchen|kitchenette|kit/.test(l)) return 'kitchen';
    if (/living|lounge|family|great_room/.test(l)) return 'living';
    if (/dining/.test(l)) return 'dining';
    if (/office|study|den|work/.test(l)) return 'office';
    if (/garage|carport/.test(l)) return 'garage';
    if (/walk.*in.*closet|wic/.test(l)) return 'walk_in_closet';
    if (/closet|wardrobe/.test(l)) return 'closet';
    if (/laundry|wash/.test(l)) return 'laundry';
    if (/balcony|porch|deck|patio|terrace|veranda/.test(l)) return 'balcony';
    if (/hallway|corridor|hall|passage/.test(l)) return 'hallway';
    if (/foyer|entry|vestibule|mudroom|lobby/.test(l)) return 'foyer';
    if (/pantry/.test(l)) return 'pantry';
    if (/mech|utility|mechanical|furnace|hvac/.test(l)) return 'utility';
    if (/storage|store/.test(l)) return 'storage';
    return l;
  };

  const roomCounts: Record<string, number> = {};
  result.detections.forEach((d) => {
    const rawLabel = d.label || (d.class ? d.class.replace(/^space_/, '') : '') || '';
    const type = normalizeRoomType(rawLabel);
    roomCounts[type] = (roomCounts[type] || 0) + 1;
  });

  const bedrooms = roomCounts['bedroom'] || 0;
  const bathrooms = roomCounts['bathroom'] || 0;
  const kitchens = roomCounts['kitchen'] || 0;
  const livingRooms = roomCounts['living'] || 0;
  const diningRooms = roomCounts['dining'] || 0;
  const garages = roomCounts['garage'] || 0;
  const offices = roomCounts['office'] || 0;
  const closets = (roomCounts['closet'] || 0) + (roomCounts['walk_in_closet'] || 0);
  const laundry = roomCounts['laundry'] || 0;
  const balconies = roomCounts['balcony'] || 0;
  const hallways = roomCounts['hallway'] || 0;
  const foyers = roomCounts['foyer'] || 0;
  const utilities = roomCounts['utility'] || 0;
  const pantries = roomCounts['pantry'] || 0;
  const storageRooms = roomCounts['storage'] || 0;

  const handledTypes = new Set([
    'bedroom', 'bathroom', 'kitchen', 'living', 'dining', 'office', 'garage',
    'closet', 'walk_in_closet', 'laundry', 'balcony', 'hallway', 'foyer',
    'utility', 'pantry', 'storage'
  ]);
  const otherRoomTypes = Object.entries(roomCounts).filter(([type]) => !handledTypes.has(type));

  const totalAreaSqft = result.building_info?.total_area_sqft
    ? result.building_info.total_area_sqft
    : Math.round(totalArea * 10.764);

  const buildingType = result.building_info?.building_type || 'Residential';
  const numFloors = result.building_info?.num_floors || 1;
  const scaleInfo = result.scale_info;
  const unitSystem = scaleInfo?.unit_system || 'metric';

  // Wall classification counts
  const extWalls = result.walls?.filter(w => w.wall_type === 'exterior_wall' || w.wall_type === 'load_bearing_wall').length || result.building_info?.num_exterior_walls || 0;
  const intWalls = result.walls?.filter(w => w.wall_type === 'interior_wall').length || result.building_info?.num_interior_walls || 0;
  const numDoors = result.building_info?.num_doors || 0;
  const numWindows = result.building_info?.num_windows || 0;

  const summaryParts: string[] = [];
  if (bedrooms > 0) summaryParts.push(`${bedrooms} Bed`);
  if (bathrooms > 0) summaryParts.push(`${bathrooms} Bath`);
  if (kitchens > 0) summaryParts.push(`${kitchens} Kitchen`);
  if (livingRooms > 0) summaryParts.push(`${livingRooms} Living`);
  if (closets > 0) summaryParts.push(`${closets} Closet`);
  if (laundry > 0) summaryParts.push(`${laundry} Laundry`);
  const summaryLine = summaryParts.length > 0 ? summaryParts.join(' · ') : `${result.detections.length} Rooms`;

  const RoomChip = ({ count, label, icon: Icon, color }: { count: number; label: string; icon: any; color: string }) => {
    if (count === 0) return null;
    return (
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
        <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
        <div>
          <div className="text-xs font-semibold">{count}</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      </div>
    );
  };

  // Format dimension display based on unit system
  const formatDimensions = (d: any) => {
    if (unitSystem === 'imperial' && d.width_ft && d.depth_ft) {
      return `${d.width_ft}'×${d.depth_ft}'`;
    }
    if (d.width_m && d.depth_m) {
      return `${d.width_m}×${d.depth_m}m`;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      {/* No Dimensions Warning */}
      {!dimensionsAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">No Dimensions Detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              This blueprint does not contain written dimension annotations. Room sizes, areas, and square footage 
              cannot be accurately determined. Please submit a plan with dimensions (e.g., 14'-6" × 12'-0") to generate 
              a precise analysis and accurate 3D model with real-world measurements.
            </p>
          </div>
        </div>
      )}

      {/* Visual Draft Warning — scale bar found but no individual room dimensions */}
      {result.visual_draft_only && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Visual Draft Mode</p>
            <p className="text-xs text-muted-foreground mt-1">
              {result.visual_draft_warning || 'Generated via Scale Bar only; internal room dimensions are estimated.'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">3D Model Generated</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {summaryLine} {dimensionsAvailable ? `· ${totalAreaSqft} sq ft` : ''} · {buildingType} · {numFloors} {numFloors > 1 ? 'Floors' : 'Floor'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onReset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1.5" />
            New Blueprint
          </Button>
        </div>
      </div>

      {/* Scale & Measurement Info */}
      {scaleInfo && (
        <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">Scale:</span>
            <span className="text-muted-foreground">
              {scaleInfo.scale_text || `${scaleInfo.scale_source || 'auto-detected'}`}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">Units:</span>
            <Badge variant="outline" className="text-[10px] h-5">
              {unitSystem === 'imperial' ? 'Imperial (ft/in)' : 'Metric (m)'}
            </Badge>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">Walls:</span>
            <span className="text-muted-foreground">
              {extWalls} exterior · {intWalls} interior
            </span>
          </div>
          {(numDoors > 0 || numWindows > 0) && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground">
                {numDoors > 0 && `🚪 ${numDoors} doors`}
                {numDoors > 0 && numWindows > 0 && ' · '}
                {numWindows > 0 && `🪟 ${numWindows} windows`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Room Breakdown Summary */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-1">Room Summary</h3>
        <p className="text-xs text-muted-foreground mb-4">Complete overview of all detected spaces and areas</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#4582D1]">{bedrooms}</div>
            <div className="text-xs text-muted-foreground">Bedrooms</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#38C0CC]">{bathrooms}</div>
            <div className="text-xs text-muted-foreground">Bathrooms</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#F2C42E]">{kitchens}</div>
            <div className="text-xs text-muted-foreground">Kitchens</div>
          </div>
          <div className="text-center">
            {dimensionsAvailable ? (
              <>
                <div className="text-2xl font-bold text-[#59BF82]">{totalAreaSqft}</div>
                <div className="text-xs text-muted-foreground">Total sq ft</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">No dimensions</div>
              </>
            )}
          </div>
        </div>

        <Separator className="my-3" />
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
          <RoomChip count={livingRooms} label="Living" icon={Sofa} color="#59BF82" />
          <RoomChip count={diningRooms} label="Dining" icon={UtensilsCrossed} color="#E87F37" />
          <RoomChip count={offices} label="Office" icon={Briefcase} color="#9470DB" />
          <RoomChip count={garages} label="Garage" icon={Car} color="#9999A0" />
          <RoomChip count={closets} label="Closets" icon={Archive} color="#D9C7EB" />
          <RoomChip count={laundry} label="Laundry" icon={WashingMachine} color="#73D9E6" />
          <RoomChip count={balconies} label="Balcony" icon={TreePine} color="#8CD173" />
          <RoomChip count={hallways} label="Hallway" icon={DoorOpen} color="#D1D1CC" />
          <RoomChip count={foyers} label="Foyer" icon={Home} color="#E6C78E" />
          <RoomChip count={utilities} label="Utility" icon={Wrench} color="#B8945B" />
          <RoomChip count={pantries} label="Pantry" icon={CookingPot} color="#CCAA59" />
          <RoomChip count={storageRooms} label="Storage" icon={Warehouse} color="#B3AFA5" />
          {otherRoomTypes.map(([type, count]) => (
            <div key={type} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <Square className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold">{count}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{type.replace(/_/g, ' ')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Room list — show names only when no dimensions, show full details when dimensions exist */}
        {result.detections.length > 0 && (
          <>
            <Separator className="my-3" />
            <details className="group" open>
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                {dimensionsAvailable ? '📐 Individual room dimensions' : '🏠 Detected rooms'} ({result.detections.length} spaces)
                {dimensionsAvailable && scaleInfo?.scale_source === 'text' && (
                  <Badge variant="outline" className="ml-2 text-[10px] h-4">OCR-calibrated</Badge>
                )}
              </summary>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {result.detections.map((d, idx) => {
                  const roomType = normalizeRoomType(d.label || d.class || '');
                  const color = getRoomColor(roomType);
                  const dims = dimensionsAvailable ? formatDimensions(d) : '';
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-md px-2 py-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-black/10" style={{ backgroundColor: color }} />
                      <div className="text-xs min-w-0 flex-1">
                        <span className="font-medium">{d.name || (d.label || roomType).replace(/_/g, ' ')}</span>
                        {dims && (
                          <span className="text-muted-foreground ml-1">{dims}</span>
                        )}
                        {dimensionsAvailable && d.area_m2 && (
                          <span className="text-muted-foreground/70 ml-1">({d.area_m2} m²)</span>
                        )}
                      </div>
                      {dimensionsAvailable && d.original_dimension_text && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1 flex-shrink-0">
                          {d.original_dimension_text}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          </>
        )}

        {/* Wall Classification Detail */}
        {(extWalls > 0 || intWalls > 0) && (
          <>
            <Separator className="my-3" />
            <details className="group">
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                🧱 Wall classification ({extWalls + intWalls} walls)
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-md p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-sm bg-[#404048] border border-black/20" />
                    <span className="text-xs font-medium">Exterior / Load-Bearing</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {extWalls} walls
                    {result.building_info?.exterior_wall_thickness_m && (
                      <span> · {(result.building_info.exterior_wall_thickness_m * 100).toFixed(0)}cm thick</span>
                    )}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-md p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-sm bg-[#d9d4cc] border border-black/10" />
                    <span className="text-xs font-medium">Interior / Partition</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {intWalls} walls
                    {result.building_info?.interior_wall_thickness_m && (
                      <span> · {(result.building_info.interior_wall_thickness_m * 100).toFixed(0)}cm thick</span>
                    )}
                  </div>
                </div>
              </div>
            </details>
          </>
        )}

        <Separator className="my-3" />
        <div className="flex flex-wrap gap-2">
          {dimensionsAvailable && <Badge variant="secondary" className="text-xs">{totalArea.toFixed(0)} m²</Badge>}
          <Badge variant="secondary" className="text-xs">{buildingType}</Badge>
          <Badge variant="secondary" className="text-xs">{numFloors} {numFloors > 1 ? 'Floors' : 'Floor'}</Badge>
          {result.building_info?.exterior_wall_thickness_m && (
            <Badge variant="secondary" className="text-xs">
              Ext. Wall: {(result.building_info.exterior_wall_thickness_m * 100).toFixed(0)}cm
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {result.detections.length} Total Rooms
          </Badge>
          {!dimensionsAvailable && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">
              ⚠ No dimensions on plan
            </Badge>
          )}
          {dimensionsAvailable && scaleInfo?.scale_source && (
            <Badge variant="outline" className="text-xs">
              Scale: {scaleInfo.scale_source}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as '3d' | '2d')}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="3d" className="gap-1.5"><Box className="h-3.5 w-3.5" />3D Viewer</TabsTrigger>
          <TabsTrigger value="2d" className="gap-1.5"><Home className="h-3.5 w-3.5" />Floor Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="3d" className="space-y-3 mt-3">
          <div className="relative rounded-xl overflow-hidden border border-border shadow-lg" style={{ height: 580 }}>
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
              <color attach="background" args={[bgMode === 'dark' ? '#0f172a' : '#e8edf5']} />
              {bgMode === 'light' && <fog attach="fog" args={['#e8edf5', 30, 80]} />}
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
          </div>

          <p className="text-xs text-muted-foreground pl-1">
            🖱 Drag to rotate · Scroll to zoom · Right-click to pan · Each color = distinct room type · Dark walls = exterior/structural
          </p>

          {/* Room legend */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              Detected Rooms
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {result.detections.map((d, idx) => {
                const roomType = normalizeRoomType(d.label || d.class || '');
                const color = getRoomColor(roomType);
                const dims = formatDimensions(d);
                return (
                  <div key={idx} className="flex items-start gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0 border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate leading-tight">{d.name || roomType}</div>
                      {dims && <div className="text-xs text-muted-foreground">{dims}</div>}
                      <div className="text-xs text-muted-foreground/70">{d.area_m2} m²</div>
                      {d.original_dimension_text && (
                        <div className="text-[10px] text-primary/80 italic">{d.original_dimension_text}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="2d" className="mt-3">
          <div className="rounded-xl overflow-auto border border-border bg-card">
            <div
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.html_view) }}
              className="min-h-[500px]"
            />
          </div>
          <p className="text-xs text-muted-foreground pl-1 mt-2">
            Hover over rooms to see dimensions. Colors match the 3D model. Dark walls = exterior/structural.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
