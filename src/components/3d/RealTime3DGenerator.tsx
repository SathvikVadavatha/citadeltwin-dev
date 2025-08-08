import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, Grid3X3, Home, Maximize, Zap } from "lucide-react";
import { RoomWithDimensions } from '@/utils/enhancedRoomDetection';
import { PolygonRoom3D } from './PolygonRoom3D';
import * as THREE from 'three';

interface RealTime3DGeneratorProps {
  rooms: RoomWithDimensions[];
  title?: string;
  onDownload?: () => void;
}

const Scene: React.FC<{ rooms: RoomWithDimensions[]; showWireframe?: boolean }> = ({ 
  rooms, 
  showWireframe = false 
}) => {
  const [hoveredRoom, setHoveredRoom] = useState<RoomWithDimensions | null>(null);

  // Calculate overall building bounds from room polygons
  const buildingBounds = useMemo(() => {
    if (rooms.length === 0) return { width: 10, length: 10, centerX: 0, centerY: 0 };
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    rooms.forEach(room => {
      room.points.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    return {
      width: maxX - minX,
      length: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }, [rooms]);

  // Scale factor for 3D visualization (matching Python scale conversion)
  const scale = 0.01; // Convert pixels to world units like Python (/100)
  const extrudeHeight = 2.5; // Same as Python extrusion height

  return (
    <>
      {/* Lighting setup - optimized for interior viewing */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.4} />
      <directionalLight position={[0, 30, 0]} intensity={0.3} />

      {/* Building Foundation */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[
          buildingBounds.width * scale + 2, 
          0.2, 
          buildingBounds.length * scale + 2
        ]} />
        <meshLambertMaterial color="#8B7355" />
      </mesh>

      {/* Render Polygon-based Rooms */}
      {rooms.map((room) => (
        <PolygonRoom3D
          key={room.id}
          room={room}
          extrudeHeight={extrudeHeight}
          scale={scale}
          showWireframe={showWireframe}
          onHover={setHoveredRoom}
        />
      ))}

      {/* Grid reference */}
      <gridHelper 
        args={[
          Math.max(20, buildingBounds.width * scale + 10), 
          20, 
          '#444444', 
          '#222222'
        ]} 
        position={[0, -0.05, 0]} 
      />

      {/* Display hovered room info */}
      {hoveredRoom && (
        <Html position={[0, extrudeHeight + 2, 0]}>
          <div className="bg-background/95 border rounded-lg p-3 shadow-lg backdrop-blur max-w-xs">
            <h4 className="font-semibold text-sm">{hoveredRoom.name}</h4>
            <p className="text-xs text-muted-foreground capitalize">{hoveredRoom.type}</p>
            <p className="text-xs text-muted-foreground">
              Confidence: {Math.round(hoveredRoom.confidence * 100)}%
            </p>
          </div>
        </Html>
      )}
    </>
  );
};

export const RealTime3DGenerator: React.FC<RealTime3DGeneratorProps> = ({
  rooms,
  title = "3D Floor Plan Visualization",
  onDownload
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
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
      {/* 3D Canvas - Camera positioned for interior viewing like Python */}
      <Canvas
        camera={{ 
          position: [15, 12, 15], // Elevated view for interior viewing
          fov: 60 
        }}
        shadows
        className="w-full h-full"
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 8} // Prevent going under the floor
          maxPolarAngle={Math.PI / 2 - 0.1} // Allow near-top-down view
          target={[0, 0, 0]} // Focus on building center
        />
        <Scene rooms={rooms} showWireframe={showWireframe} />
      </Canvas>

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-background/80 backdrop-blur"
          title="Toggle Fullscreen"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowGrid(!showGrid)}
          className="bg-background/80 backdrop-blur"
          title="Toggle Grid"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowWireframe(!showWireframe)}
          className="bg-background/80 backdrop-blur"
          title="Toggle Wireframe"
        >
          <Zap className="h-4 w-4" />
        </Button>
        {onDownload && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDownload}
            className="bg-background/80 backdrop-blur"
            title="Download Model"
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
            Polygon-based 3D visualization using detected room boundaries
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