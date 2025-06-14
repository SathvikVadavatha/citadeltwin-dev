
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid, Home, DoorOpen, Square } from "lucide-react";

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
  scale: number; // pixels per meter
}

interface FloorPlanAnalyzerProps {
  imageUrl: string;
  analysisData: FloorPlanData;
}

export const FloorPlanAnalyzer: React.FC<FloorPlanAnalyzerProps> = ({
  imageUrl,
  analysisData
}) => {
  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'bedroom': return '🛏️';
      case 'living_room': return '🛋️';
      case 'kitchen': return '🍳';
      case 'bathroom': return '🚿';
      case 'hallway': return '🚪';
      default: return '🏠';
    }
  };

  const getRoomColor = (type: string) => {
    switch (type) {
      case 'bedroom': return 'bg-blue-100 border-blue-300';
      case 'living_room': return 'bg-green-100 border-green-300';
      case 'kitchen': return 'bg-yellow-100 border-yellow-300';
      case 'bathroom': return 'bg-purple-100 border-purple-300';
      case 'hallway': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5" />
          Floor Plan Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Annotated Floor Plan */}
        <div className="relative border rounded-lg overflow-hidden">
          <img 
            src={imageUrl} 
            alt="Floor plan"
            className="w-full"
          />
          
          {/* Room Overlays */}
          {analysisData.rooms.map((room) => (
            <div
              key={room.id}
              className={`absolute border-2 ${getRoomColor(room.type)} opacity-30 flex items-center justify-center`}
              style={{
                left: `${room.bounds.x}%`,
                top: `${room.bounds.y}%`,
                width: `${room.bounds.width}%`,
                height: `${room.bounds.height}%`,
              }}
            >
              <span className="text-xs font-bold">
                {getRoomIcon(room.type)} {room.type.replace('_', ' ')}
              </span>
            </div>
          ))}

          {/* Door Markers */}
          {analysisData.doors.map((door) => (
            <div
              key={door.id}
              className="absolute w-2 h-2 bg-red-500 rounded-full"
              style={{
                left: `${door.position.x}%`,
                top: `${door.position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              title="Door"
            />
          ))}

          {/* Window Markers */}
          {analysisData.windows.map((window) => (
            <div
              key={window.id}
              className="absolute w-2 h-2 bg-blue-500 rounded-full"
              style={{
                left: `${window.position.x}%`,
                top: `${window.position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              title="Window"
            />
          ))}
        </div>

        {/* Analysis Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rooms Summary */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Home className="h-4 w-4" />
              Rooms ({analysisData.rooms.length})
            </h4>
            {analysisData.rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {getRoomIcon(room.type)}
                  {room.type.replace('_', ' ')}
                </span>
                <Badge variant="secondary">
                  {room.area.toFixed(1)}m²
                </Badge>
              </div>
            ))}
          </div>

          {/* Structural Elements */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Square className="h-4 w-4" />
              Structure
            </h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Walls:</span>
                <Badge variant="outline">{analysisData.walls.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Doors:</span>
                <Badge variant="outline">{analysisData.doors.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Windows:</span>
                <Badge variant="outline">{analysisData.windows.length}</Badge>
              </div>
            </div>
          </div>

          {/* Measurements */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Measurements
            </h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Scale:</span>
                <Badge variant="outline">{analysisData.scale} px/m</Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Area:</span>
                <Badge variant="outline">
                  {analysisData.rooms.reduce((sum, room) => sum + room.area, 0).toFixed(1)}m²
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
