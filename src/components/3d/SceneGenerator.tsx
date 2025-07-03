
import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface Room {
  id: string;
  type: 'bedroom' | 'living_room' | 'kitchen' | 'bathroom' | 'hallway';
  bounds: { x: number; y: number; width: number; height: number };
  area: number;
}

interface Wall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
}

interface Door {
  id: string;
  position: { x: number; y: number };
  width: number;
  wallId: string;
}

interface Window {
  id: string;
  position: { x: number; y: number };
  width: number;
  wallId: string;
}

interface FloorPlanData {
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  scale: number;
}

interface SceneGeneratorProps {
  floorPlanData: FloorPlanData;
}

const Room3D = ({ room, scale }: { room: Room; scale: number }) => {
  const roomMesh = useMemo(() => {
    // Convert percentage to 3D coordinates
    const width = (room.bounds.width / 100) * scale;
    const height = (room.bounds.height / 100) * scale;
    const x = (room.bounds.x / 100) * scale - scale / 2;
    const z = (room.bounds.y / 100) * scale - scale / 2;

    return {
      position: [x + width / 2, 0.1, z + height / 2] as [number, number, number],
      size: [width, 0.2, height] as [number, number, number]
    };
  }, [room, scale]);

  const getRoomColor = (type: string) => {
    switch (type) {
      case 'bedroom': return '#e3f2fd';
      case 'living_room': return '#e8f5e8';
      case 'kitchen': return '#fff3e0';
      case 'bathroom': return '#f3e5f5';
      case 'hallway': return '#f5f5f5';
      default: return '#f5f5f5';
    }
  };

  return (
    <mesh position={roomMesh.position}>
      <boxGeometry args={roomMesh.size} />
      <meshPhongMaterial color={getRoomColor(room.type)} />
    </mesh>
  );
};

const Wall3D = ({ wall, scale }: { wall: Wall; scale: number }) => {
  const wallMesh = useMemo(() => {
    const startX = (wall.start.x / 100) * scale - scale / 2;
    const startZ = (wall.start.y / 100) * scale - scale / 2;
    const endX = (wall.end.x / 100) * scale - scale / 2;
    const endZ = (wall.end.y / 100) * scale - scale / 2;

    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2));
    const angle = Math.atan2(endZ - startZ, endX - startX);
    
    const centerX = (startX + endX) / 2;
    const centerZ = (startZ + endZ) / 2;

    return {
      position: [centerX, 1.5, centerZ] as [number, number, number],
      rotation: [0, angle, 0] as [number, number, number],
      size: [length, 3, wall.thickness] as [number, number, number]
    };
  }, [wall, scale]);

  return (
    <mesh position={wallMesh.position} rotation={wallMesh.rotation}>
      <boxGeometry args={wallMesh.size} />
      <meshPhongMaterial color="#cccccc" />
    </mesh>
  );
};

const Furniture = ({ room, scale }: { room: Room; scale: number }) => {
  const furniture = useMemo(() => {
    const items = [];
    const roomWidth = (room.bounds.width / 100) * scale;
    const roomHeight = (room.bounds.height / 100) * scale;
    const x = (room.bounds.x / 100) * scale - scale / 2 + roomWidth / 2;
    const z = (room.bounds.y / 100) * scale - scale / 2 + roomHeight / 2;

    switch (room.type) {
      case 'bedroom':
        // Bed
        items.push({
          position: [x, 0.5, z] as [number, number, number],
          size: [2, 0.5, 1.8] as [number, number, number],
          color: '#8d6e63'
        });
        break;
      case 'living_room':
        // Sofa
        items.push({
          position: [x, 0.4, z] as [number, number, number],
          size: [2.5, 0.8, 1] as [number, number, number],
          color: '#5d4037'
        });
        break;
      case 'kitchen':
        // Counter
        items.push({
          position: [x, 0.9, z - roomHeight / 4] as [number, number, number],
          size: [roomWidth * 0.8, 0.1, 0.6] as [number, number, number],
          color: '#6d4c41'
        });
        break;
      case 'bathroom':
        // Toilet
        items.push({
          position: [x - roomWidth / 4, 0.4, z] as [number, number, number],
          size: [0.4, 0.8, 0.6] as [number, number, number],
          color: '#ffffff'
        });
        break;
    }

    return items;
  }, [room, scale]);

  return (
    <>
      {furniture.map((item, index) => (
        <mesh key={index} position={item.position}>
          <boxGeometry args={item.size} />
          <meshPhongMaterial color={item.color} />
        </mesh>
      ))}
    </>
  );
};

const Scene3D = ({ floorPlanData }: { floorPlanData: FloorPlanData }) => {
  const sceneScale = 10; // Scale factor for 3D scene

  return (
    <>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[sceneScale, sceneScale]} />
        <meshPhongMaterial color="#f0f0f0" />
      </mesh>

      {/* Rooms */}
      {floorPlanData.rooms?.map((room) => (
        <Room3D key={room.id} room={room} scale={sceneScale} />
      )) || null}

      {/* Walls */}
      {floorPlanData.walls?.map((wall) => (
        <Wall3D key={wall.id} wall={wall} scale={sceneScale} />
      )) || null}

      {/* Furniture */}
      {floorPlanData.rooms?.map((room) => (
        <Furniture key={`furniture-${room.id}`} room={room} scale={sceneScale} />
      )) || null}
    </>
  );
};

export const SceneGenerator: React.FC<SceneGeneratorProps> = ({ floorPlanData }) => {
  return (
    <div className="h-96 w-full border rounded-lg overflow-hidden">
      <Canvas
        camera={{ 
          position: [8, 8, 8], 
          fov: 50,
          near: 0.1,
          far: 100
        }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #f0f0f0)' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, 10, -10]} intensity={0.3} />
        
        <Scene3D floorPlanData={floorPlanData} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
};
