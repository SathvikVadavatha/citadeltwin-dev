import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Edges, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Activity, Box, CheckCircle2 } from "lucide-react";
import * as THREE from "three";

const STEEL = "#596675";
const CONCRETE = "#d5d2cb";
const GLASS = "#a8bdc5";
const ACCENT = "#e8600a";
const SAFE = "#6f9b85";

function StructuralMember({
  position,
  scale,
  color = STEEL,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color={color} roughness={0.56} metalness={0.22} />
      <Edges color="#34404d" threshold={24} />
    </mesh>
  );
}

function DigitalTwinModel({ reduceMotion }: { reduceMotion: boolean }) {
  const model = useRef<THREE.Group>(null);

  useFrame((_, rawDelta) => {
    if (!model.current || reduceMotion) return;
    const delta = Math.min(rawDelta, 0.05);
    model.current.rotation.y += delta * 0.075;
  });

  const levels = [0.25, 2.35, 4.45];
  const columns = [-3.45, -1.15, 1.15, 3.45];
  const depthLines = [-2.15, 0, 2.15];

  return (
    <group ref={model} rotation={[0, -0.48, 0]} position={[0, -2.4, 0]}>
      <mesh position={[0, -0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[8.8, 0.28, 5.8]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.92} />
        <Edges color="#87909a" threshold={20} />
      </mesh>

      {levels.map((height, levelIndex) => (
        <group key={height}>
          <mesh position={[0, height, 0]} receiveShadow castShadow>
            <boxGeometry args={[8, 0.17, 5]} />
            <meshStandardMaterial
              color={levelIndex === 2 ? "#c5cbd0" : CONCRETE}
              roughness={0.78}
              metalness={0.05}
            />
            <Edges color="#6f7882" threshold={24} />
          </mesh>

          {depthLines.map((z) => (
            <StructuralMember key={`beam-x-${height}-${z}`} position={[0, height + 0.22, z]} scale={[8.15, 0.24, 0.22]} />
          ))}
          {columns.map((x) => (
            <StructuralMember key={`beam-z-${height}-${x}`} position={[x, height + 0.22, 0]} scale={[0.22, 0.24, 4.55]} />
          ))}
        </group>
      ))}

      {columns.flatMap((x) =>
        depthLines.map((z) => (
          <StructuralMember key={`column-${x}-${z}`} position={[x, 3.35, z]} scale={[0.28, 6.25, 0.28]} />
        )),
      )}

      <mesh position={[0, 3.35, -2.28]} castShadow>
        <boxGeometry args={[6.4, 1.65, 0.055]} />
        <meshPhysicalMaterial color={GLASS} transparent opacity={0.28} roughness={0.18} metalness={0.08} />
      </mesh>

      <StructuralMember position={[1.15, 3.4, 2.17]} scale={[0.34, 1.05, 0.34]} color={ACCENT} />
      <StructuralMember position={[-1.15, 5.5, -2.17]} scale={[0.34, 1.05, 0.34]} color={SAFE} />

      <mesh position={[1.15, 4.04, 2.17]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

export function HeroDigitalTwin() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-card shadow-[var(--skeuo-shadow-deep)]">
      <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Box className="h-4 w-4 text-accent" />
          Structural twin · Tower A
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Live model
        </div>
      </div>

      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [10.8, 8.2, 11.8], fov: 34, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        className="cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#e8e6e1"]} />
        <fog attach="fog" args={["#e8e6e1", 19, 34]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[8, 13, 7]}
          intensity={2.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <Environment>
          <Lightformer intensity={2.2} position={[0, 8, 4]} scale={[10, 4, 1]} />
          <Lightformer intensity={1.1} color="#b7c1c7" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        </Environment>
        <DigitalTwinModel reduceMotion={Boolean(prefersReducedMotion)} />
        <ContactShadows position={[0, -2.55, 0]} opacity={0.32} scale={15} blur={2.5} far={8} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3.8}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0.6, 0]}
        />
      </Canvas>

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 grid grid-cols-3 overflow-hidden rounded-md border border-border bg-card/90 shadow-[var(--skeuo-shadow-raised)] backdrop-blur-md">
        <div className="border-r border-border px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground"><Activity className="h-3 w-3" /> Stress</div>
          <div className="mt-1 text-xs font-semibold text-foreground">18.4 MPa</div>
        </div>
        <div className="border-r border-border px-3 py-2.5">
          <div className="text-[10px] uppercase text-muted-foreground">Deflection</div>
          <div className="mt-1 text-xs font-semibold text-foreground">2.1 mm</div>
        </div>
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-accent" /> Status</div>
          <div className="mt-1 text-xs font-semibold text-foreground">Passing</div>
        </div>
      </div>
    </div>
  );
}