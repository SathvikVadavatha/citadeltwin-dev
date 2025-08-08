import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RoomWithDimensions } from '@/utils/enhancedRoomDetection';
import { createExtrudedRoomGeometry } from '@/utils/polygon3DGeometry';
import * as THREE from 'three';

interface PolygonRoom3DProps {
  room: RoomWithDimensions;
  extrudeHeight?: number;
  scale?: number;
  showWireframe?: boolean;
  onHover?: (room: RoomWithDimensions | null) => void;
}

export const PolygonRoom3D: React.FC<PolygonRoom3DProps> = ({
  room,
  extrudeHeight = 2.5,
  scale = 0.01,
  showWireframe = false,
  onHover
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Create the extruded room geometry (matches Python matplotlib implementation)
  const roomGeometry = useMemo(() => {
    return createExtrudedRoomGeometry(room, extrudeHeight, scale);
  }, [room, extrudeHeight, scale]);

  useFrame(() => {
    if (meshRef.current) {
      // Subtle hover animation
      meshRef.current.scale.setScalar(hovered ? 1.02 : 1);
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(room);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(null);
  };

  return (
    <group>
      {/* Main extruded room mesh */}
      <mesh
        ref={meshRef}
        geometry={roomGeometry.geometry}
        material={roomGeometry.material}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      />

      {/* Room label positioned at calculated center */}
      <Html position={roomGeometry.labelPosition.toArray()}>
        <div className="bg-background/90 border rounded px-2 py-1 text-xs font-medium shadow-lg backdrop-blur pointer-events-none">
          <div className="font-semibold">{room.name}</div>
          <div className="text-xs text-muted-foreground">
            {room.realWorldDimensions ? 
              `${room.realWorldDimensions.width}' × ${room.realWorldDimensions.length}'` :
              `${Math.round(room.dimensions.width)}px × ${Math.round(room.dimensions.length)}px`
            }
          </div>
          <div className="text-xs text-muted-foreground">
            {room.realWorldDimensions ? 
              `${room.realWorldDimensions.area} sq ${room.realWorldDimensions.units}` :
              `${Math.round(room.dimensions.area)} sq px`
            }
          </div>
        </div>
      </Html>

      {/* Optional wireframe for debugging */}
      {showWireframe && (
        <primitive
          object={createRoomWireframe(room, extrudeHeight, scale)}
        />
      )}
    </group>
  );
};

/**
 * Helper function to create wireframe (imported from utility)
 */
function createRoomWireframe(
  room: RoomWithDimensions,
  extrudeHeight: number,
  scale: number
): THREE.LineSegments {
  const points: THREE.Vector3[] = [];
  
  // Calculate center for positioning
  const centerX = room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length * scale;
  const centerZ = room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length * scale;

  // Bottom and top edges
  for (let i = 0; i < room.points.length; i++) {
    const current = room.points[i];
    const next = room.points[(i + 1) % room.points.length];
    
    // Bottom edge
    points.push(new THREE.Vector3(current.x * scale - centerX, 0, current.y * scale - centerZ));
    points.push(new THREE.Vector3(next.x * scale - centerX, 0, next.y * scale - centerZ));
    
    // Top edge
    points.push(new THREE.Vector3(current.x * scale - centerX, extrudeHeight, current.y * scale - centerZ));
    points.push(new THREE.Vector3(next.x * scale - centerX, extrudeHeight, next.y * scale - centerZ));
    
    // Vertical edge
    points.push(new THREE.Vector3(current.x * scale - centerX, 0, current.y * scale - centerZ));
    points.push(new THREE.Vector3(current.x * scale - centerX, extrudeHeight, current.y * scale - centerZ));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ 
    color: 0x000000, 
    transparent: true, 
    opacity: 0.2 
  });
  
  return new THREE.LineSegments(geometry, material);
}