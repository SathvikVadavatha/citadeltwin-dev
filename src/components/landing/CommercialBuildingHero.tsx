import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  Lightformer,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { Activity, Box, CheckCircle2, Rotate3D } from "lucide-react";
import * as THREE from "three";

const BUILDING_URL = "/models/commercial-building.glb";

function CommercialBuilding() {
  const { scene } = useGLTF(BUILDING_URL);

  const building = useMemo(() => {
    const clone = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 7.4 / Math.max(size.x, size.z, 1);
    clone.scale.setScalar(scale);
    clone.updateWorldMatrix(true, true);

    const scaledBounds = new THREE.Box3().setFromObject(clone);
    const center = scaledBounds.getCenter(new THREE.Vector3());
    clone.position.set(-center.x - 0.65, -scaledBounds.min.y, -center.z);

    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });

    return clone;
  }, [scene]);

  return <primitive object={building} />;
}

function StructuralBay() {
  const group = useRef<THREE.Group>(null);
  const beamMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f26a21", metalness: 0.42, roughness: 0.36 }),
    [],
  );
  const columnMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#657281", metalness: 0.72, roughness: 0.28 }),
    [],
  );

  useEffect(() => () => {
    beamMaterial.dispose();
    columnMaterial.dispose();
  }, [beamMaterial, columnMaterial]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const pulse = 0.72 + Math.sin(clock.elapsedTime * 1.4) * 0.12;
    beamMaterial.emissive.setRGB(0.35 * pulse, 0.07 * pulse, 0.01 * pulse);
  });

  const columns = [-1.55, 0, 1.55];
  const floors = [0.22, 1.32, 2.42, 3.52];

  return (
    <group ref={group} position={[3.15, 0, 0.2]}>
      {columns.map((x) => (
        <mesh key={`column-${x}`} position={[x, 1.85, 0]} material={columnMaterial} castShadow>
          <boxGeometry args={[0.12, 3.7, 0.12]} />
        </mesh>
      ))}
      {floors.map((y, index) => (
        <group key={`floor-${y}`}>
          <mesh position={[0, y, 0]} material={index === 2 ? beamMaterial : columnMaterial} castShadow>
            <boxGeometry args={[3.25, 0.13, 0.13]} />
          </mesh>
          <mesh position={[0, y, -1.45]} material={columnMaterial} castShadow>
            <boxGeometry args={[3.25, 0.1, 0.1]} />
          </mesh>
          {columns.map((x) => (
            <mesh key={`joist-${x}-${y}`} position={[x, y, -0.72]} material={index === 2 ? beamMaterial : columnMaterial} castShadow>
              <boxGeometry args={[0.1, 0.1, 1.5]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function SiteUtilities() {
  return (
    <group position={[0, 0.035, 0]}>
      <mesh position={[0, 0, 3.25]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[8.6, 0.04]} />
        <meshBasicMaterial color="#2b83c6" />
      </mesh>
      <mesh position={[0, 0.01, 3.42]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[8.6, 0.035]} />
        <meshBasicMaterial color="#55a86a" />
      </mesh>
      <mesh position={[0, 0.02, 3.59]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[8.6, 0.03]} />
        <meshBasicMaterial color="#f26a21" />
      </mesh>
    </group>
  );
}

function PresentationRig({ reducedMotion }: { reducedMotion: boolean }) {
  const rig = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!rig.current || reducedMotion) return;
    rig.current.position.y = Math.sin(clock.elapsedTime * 0.65) * 0.045;
    rig.current.rotation.y += delta * 0.018;
  });

  return (
    <group ref={rig} rotation-y={-0.18}>
      <Suspense fallback={null}>
        <CommercialBuilding />
      </Suspense>
      <StructuralBay />
      <SiteUtilities />
    </group>
  );
}

useGLTF.preload(BUILDING_URL);

export function CommercialBuildingHero() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-card shadow-skeuo-deep">
      <div
        className="absolute inset-0"
        role="img"
        aria-label="Interactive 3D model of a modern commercial building with structural analysis"
      >
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [9.6, 7.2, 10.8], fov: 38, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#f3f1eb"]} />
          <fog attach="fog" args={["#f3f1eb", 16, 30]} />
          <hemisphereLight args={["#dcecff", "#c7bda9", 1.25]} />
          <directionalLight
            position={[7, 12, 8]}
            intensity={2.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
          />
          <Environment>
            <Lightformer intensity={2.4} position={[0, 8, 2]} scale={[12, 12, 1]} />
            <Lightformer intensity={1.2} color="#d8e9f2" position={[-7, 3, 1]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
          </Environment>
          <PresentationRig reducedMotion={reducedMotion} />
          <mesh rotation-x={-Math.PI / 2} position-y={-0.08} receiveShadow>
            <planeGeometry args={[24, 24]} />
            <meshStandardMaterial color="#e9e6de" roughness={0.96} />
          </mesh>
          <Grid
            position={[0, -0.055, 0]}
            args={[22, 22]}
            cellSize={0.5}
            cellThickness={0.35}
            cellColor="#b7bec5"
            sectionSize={2}
            sectionThickness={0.7}
            sectionColor="#8b959f"
            fadeDistance={16}
            fadeStrength={1.3}
            infiniteGrid
          />
          <ContactShadows position={[0, -0.045, 0]} opacity={0.28} scale={16} blur={2.2} far={10} />
          <OrbitControls
            makeDefault
            target={[0, 1.8, 0]}
            enablePan={false}
            enableZoom={false}
            enableDamping
            dampingFactor={0.06}
            autoRotate={!reducedMotion}
            autoRotateSpeed={0.38}
            minPolarAngle={Math.PI / 4.2}
            maxPolarAngle={Math.PI / 2.15}
          />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between border-b border-border bg-card/80 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Box className="h-3.5 w-3.5 text-accent" />
          Riverside Civic Center
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Model synchronized
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-12 w-[132px] rounded-md border border-border bg-card/90 p-3 shadow-skeuo-card backdrop-blur-md sm:w-[150px]">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
          <Activity className="h-3 w-3 text-accent" /> Structural analysis
        </div>
        <div className="text-2xl font-semibold leading-none text-foreground">2.4</div>
        <div className="mt-1 text-[10px] text-muted-foreground">Safety factor</div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-4/5 bg-emerald-500" />
        </div>
        <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> All checks passed
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-border bg-card/85 px-2.5 py-2 text-[10px] text-muted-foreground shadow-skeuo-card backdrop-blur-md">
        <Rotate3D className="h-3.5 w-3.5 text-accent" />
        Drag to inspect model
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-border bg-card/85 px-2.5 py-2 text-[10px] font-medium text-foreground shadow-skeuo-card backdrop-blur-md">
        96% compliant
      </div>
    </div>
  );
}