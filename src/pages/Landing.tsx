import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const TowerModel = () => {
  const modelRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.08;
    }
  });

  const levels = Array.from({ length: 8 }, (_, level) => ({
    y: level * 0.72,
    width: 5.6 - level * 0.16,
    depth: 3.8 - level * 0.08,
  }));

  return (
    <group ref={modelRef} position={[0, -2.7, 0]} rotation={[0, -0.55, 0]}>
      <mesh receiveShadow position={[0, -0.15, 0]}>
        <boxGeometry args={[7.8, 0.3, 5.8]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.92} />
      </mesh>

      {levels.map(({ y, width, depth }, level) => (
        <group key={level} position={[0, y, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, 0.14, depth]} />
            <meshStandardMaterial color="#d7d9dc" roughness={0.72} />
          </mesh>

          {[-1, 1].flatMap((xSide) =>
            [-1, 1].map((zSide) => (
              <mesh
                key={`${xSide}-${zSide}`}
                castShadow
                position={[xSide * (width / 2 - 0.18), 0.36, zSide * (depth / 2 - 0.18)]}
              >
                <boxGeometry args={[0.18, 0.72, 0.18]} />
                <meshStandardMaterial color="#b5b9bd" roughness={0.75} />
              </mesh>
            )),
          )}

          {level < levels.length - 1 && (
            <>
              <mesh position={[0, 0.36, depth / 2 - 0.08]}>
                <boxGeometry args={[width - 0.55, 0.55, 0.06]} />
                <meshPhysicalMaterial
                  color="#829aaa"
                  transparent
                  opacity={0.56}
                  roughness={0.18}
                  metalness={0.08}
                />
              </mesh>
              <mesh position={[width / 2 - 0.08, 0.36, 0]}>
                <boxGeometry args={[0.06, 0.55, depth - 0.55]} />
                <meshPhysicalMaterial
                  color="#829aaa"
                  transparent
                  opacity={0.56}
                  roughness={0.18}
                  metalness={0.08}
                />
              </mesh>
            </>
          )}
        </group>
      ))}

      <mesh castShadow position={[0, 5.58, 0]}>
        <boxGeometry args={[4.72, 0.26, 3.32]} />
        <meshStandardMaterial color="#c4c7ca" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.7, 6.05, 0]}>
        <boxGeometry args={[1.1, 0.7, 1.4]} />
        <meshStandardMaterial color="#a8adb1" roughness={0.78} />
      </mesh>
    </group>
  );
};

const Landing = () => {
  useEffect(() => {
    document.title = "CitadelTwin — 3D Digital Twin";
  }, []);

  return (
    <main className="h-dvh w-full overflow-hidden bg-background" aria-label="CitadelTwin 3D model">
      <Canvas
        camera={{ position: [10, 7, 11], fov: 38, near: 0.1, far: 100 }}
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#1f2429"]} />
        <fog attach="fog" args={["#1f2429", 17, 32]} />
        <ambientLight intensity={1.15} />
        <hemisphereLight args={["#e7eef2", "#444b50", 1.25]} />
        <directionalLight
          castShadow
          position={[8, 12, 7]}
          intensity={2.4}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
        />
        <Suspense fallback={null}>
          <TowerModel />
          <ContactShadows position={[0, -2.88, 0]} opacity={0.48} scale={18} blur={2.8} far={7} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={8}
          maxDistance={24}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0.2, 0]}
        />
      </Canvas>
    </main>
  );
};

export default Landing;