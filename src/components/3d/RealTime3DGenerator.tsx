import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, Grid3X3, Home, Maximize } from "lucide-react";
import { RoomWithDimensions } from '@/utils/enhancedRoomDetection';
import * as THREE from 'three';

interface RealTime3DGeneratorProps {
  rooms: RoomWithDimensions[];
  title?: string;
  onDownload?: () => void;
}

interface Room3DProps {
  room: RoomWithDimensions;
  position: [number, number, number];
  scale: number;
  color: string;
}

const Room3D: React.FC<Room3DProps> = ({ room, position, scale, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.02 : 1);
    }
  });

  // Convert room dimensions to 3D units (scale down for better viewing)
  const width = (room.realWorldDimensions?.width || room.dimensions.width / 10) * scale;
  const length = (room.realWorldDimensions?.length || room.dimensions.length / 10) * scale;
  const height = 2.5 * scale; // Standard room height

  return (
    <group position={position}>
      {/* Room Floor */}
      <mesh
        ref={meshRef}
        position={[0, -height/2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[width, 0.1, length]} />
        <meshLambertMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* Room Walls */}
      <group>
        {/* Front wall */}
        <mesh position={[0, 0, length/2]}>
          <boxGeometry args={[width, height, 0.1]} />
          <meshLambertMaterial color={color} transparent opacity={0.6} />
        </mesh>
        
        {/* Back wall */}
        <mesh position={[0, 0, -length/2]}>
          <boxGeometry args={[width, height, 0.1]} />
          <meshLambertMaterial color={color} transparent opacity={0.6} />
        </mesh>
        
        {/* Left wall */}
        <mesh position={[-width/2, 0, 0]}>
          <boxGeometry args={[0.1, height, length]} />
          <meshLambertMaterial color={color} transparent opacity={0.6} />
        </mesh>
        
        {/* Right wall */}
        <mesh position={[width/2, 0, 0]}>
          <boxGeometry args={[0.1, height, length]} />
          <meshLambertMaterial color={color} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Room Label */}
      <Html position={[0, height/2 + 0.5, 0]} center>
        <div className="bg-background border rounded px-2 py-1 text-xs font-medium shadow-lg">
          {room.name}
          <div className="text-xs text-muted-foreground">
            {room.realWorldDimensions ? 
              `${room.realWorldDimensions.width}' × ${room.realWorldDimensions.length}'` :
              `${Math.round(room.dimensions.width)}px × ${Math.round(room.dimensions.length)}px`
            }
          </div>
        </div>
      </Html>

      {/* Add basic furniture based on room type */}
      {room.type === 'bedroom' && (
        <mesh position={[width/4, -height/2 + 0.3, 0]}>
          <boxGeometry args={[1.5, 0.6, 2]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
      )}

      {room.type === 'bathroom' && (
        <group>
          <mesh position={[-width/3, -height/2 + 0.4, length/3]}>
            <cylinderGeometry args={[0.3, 0.3, 0.8]} />
            <meshLambertMaterial color="#FFFFFF" />
          </mesh>
        </group>
      )}

      {room.type === 'kitchen' && (
        <mesh position={[width/3, -height/2 + 0.5, -length/3]}>
          <boxGeometry args={[0.6, 1, 2]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
      )}
    </group>
  );
};

const Scene: React.FC<{ rooms: RoomWithDimensions[] }> = ({ rooms }) => {
  const roomColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  // Calculate overall building bounds
  const buildingBounds = useMemo(() => {
    if (rooms.length === 0) return { width: 10, length: 10 };
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    rooms.forEach(room => {
      const bounds = room.bounds;
      minX = Math.min(minX, bounds.x);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      minY = Math.min(minY, bounds.y);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });
    
    return {
      width: maxX - minX,
      length: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }, [rooms]);

  // Scale factor for 3D visualization
  const scale = 0.02;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} />

      {/* Building Foundation */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[buildingBounds.width * scale + 2, 0.2, buildingBounds.length * scale + 2]} />
        <meshLambertMaterial color="#8B7355" />
      </mesh>

      {/* Render Rooms */}
      {rooms.map((room, index) => {
        // Calculate room position relative to building center
        const roomCenterX = (room.bounds.x + room.bounds.width / 2 - buildingBounds.centerX) * scale;
        const roomCenterZ = (room.bounds.y + room.bounds.height / 2 - buildingBounds.centerY) * scale;
        
        return (
          <Room3D
            key={room.id}
            room={room}
            position={[roomCenterX, 0, roomCenterZ]}
            scale={scale}
            color={roomColors[index % roomColors.length]}
          />
        );
      })}

      {/* Grid reference */}
      <gridHelper args={[30, 30, '#444444', '#222222']} position={[0, -1.4, 0]} />
    </>
  );
};

export const RealTime3DGenerator: React.FC<RealTime3DGeneratorProps> = ({
  rooms,
  title = "3D Model Preview",
  onDownload
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [activeView, setActiveView] = useState("perspective");

  const totalArea = rooms.reduce((sum, room) => 
    sum + (room.realWorldDimensions?.area || room.dimensions.area / 100), 0
  );

  const roomTypeCounts = rooms.reduce((counts, room) => {
    counts[room.type] = (counts[room.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const viewerContent = (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-96'}`}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [15, 15, 15], fov: 50 }}
        shadows
        className="w-full h-full"
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
        <Scene rooms={rooms} />
      </Canvas>

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-background/80 backdrop-blur"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowGrid(!showGrid)}
          className="bg-background/80 backdrop-blur"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        {onDownload && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDownload}
            className="bg-background/80 backdrop-blur"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Room count overlay */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur border rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm">
          <Home className="h-4 w-4" />
          <span className="font-medium">{rooms.length} Rooms</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {Math.round(totalArea)} {rooms[0]?.realWorldDimensions?.units || 'sq ft'}
          </span>
        </div>
      </div>

      {isFullscreen && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 left-4 bg-background/80 backdrop-blur"
        >
          Exit Fullscreen
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Real-time 3D visualization from room analysis
          </p>
        </div>
        <div className="flex gap-2">
          {Object.entries(roomTypeCounts).map(([type, count]) => (
            <Badge key={type} variant="outline">
              {count} {type}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="3d" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="3d">3D View</TabsTrigger>
          <TabsTrigger value="details">Room Details</TabsTrigger>
        </TabsList>

        <TabsContent value="3d" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {viewerContent}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            {rooms.map((room, index) => (
              <Card key={room.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{room.name}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {room.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dimensions</p>
                      <p className="font-medium">
                        {room.realWorldDimensions ? 
                          `${room.realWorldDimensions.width}' × ${room.realWorldDimensions.length}'` :
                          `${Math.round(room.dimensions.width)}px × ${Math.round(room.dimensions.length)}px`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Area</p>
                      <p className="font-medium">
                        {room.realWorldDimensions ? 
                          `${room.realWorldDimensions.area} sq ${room.realWorldDimensions.units}` :
                          `${Math.round(room.dimensions.area)} sq px`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confidence</p>
                      <p className="font-medium">{Math.round(room.confidence * 100)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};