// Enhanced room-specific 3D geometry generation with improved room analysis integration

export interface RoomData {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  roomId?: number;
  roomType?: string;
  // Enhanced properties from room analysis
  area?: number;
  dimensions?: { width: number; height: number; length?: number };
  position?: { x: number; y: number; z?: number };
  bounds?: { x: number; y: number; width: number; height: number };
  type?: string;
}

export interface Room3DGeometry {
  vertices: number[];
  normals: number[];
  materials: Array<{
    color: [number, number, number];
    roughness: number;
    metallic: number;
  }>;
  roomCenter: { x: number; y: number; z: number };
  roomType: string;
}

// Enhanced room type classification based on size and position
export function classifyRoomFromAnalysis(room: RoomData, allRooms: RoomData[]): string {
  const area = room.bbox.width * room.bbox.height;
  const aspectRatio = Math.max(room.bbox.width, room.bbox.height) / Math.min(room.bbox.width, room.bbox.height);
  
  // Use existing room label if available
  if (room.label && room.label !== 'room') {
    return room.label;
  }
  
  // Classify based on size patterns
  if (area < 50) return 'bathroom';
  if (area < 80 && aspectRatio > 2) return 'hallway';
  if (area < 120) return 'bedroom';
  if (area > 300) return 'living_room';
  if (area > 200) return 'kitchen';
  
  return 'room';
}

// Generate room-specific 3D geometry with enhanced data
export function generateRoomSpecific3D(
  room: RoomData, 
  roomIndex: number, 
  scale: number = 0.1,
  floorLevel: number = 0
): Room3DGeometry {
  const roomType = room.type || room.roomType || classifyRoomFromAnalysis(room, []);
  
  // Use enhanced dimensions if available, otherwise fall back to bbox
  const bounds = room.bounds || room.bbox;
  const centerX = room.position?.x || (bounds.x + bounds.width / 2) * scale;
  const centerZ = room.position?.y || (bounds.y + bounds.height / 2) * scale;
  const roomWidth = room.dimensions?.width || bounds.width * scale;
  const roomDepth = room.dimensions?.height || bounds.height * scale;
  const roomHeight = getRoomHeight(roomType);
  
  console.log(`Enhanced room ${roomIndex}: ${roomType}, size: ${roomWidth.toFixed(1)}x${roomDepth.toFixed(1)}x${roomHeight.toFixed(1)}, position: (${centerX.toFixed(1)}, ${centerZ.toFixed(1)}), area: ${room.area || 'calculated'}, confidence: ${room.confidence || 'unknown'}`);
  
  const vertices = [];
  const normals = [];
  
  // Floor
  const floorY = floorLevel - 0.1;
  vertices.push(
    centerX - roomWidth/2, floorY, centerZ - roomDepth/2,
    centerX + roomWidth/2, floorY, centerZ - roomDepth/2,
    centerX + roomWidth/2, floorY, centerZ + roomDepth/2,
    centerX - roomWidth/2, floorY, centerZ + roomDepth/2
  );
  normals.push(...Array(4).fill([0, 1, 0]).flat());
  
  // Walls (4 walls per room)
  const wallThickness = 0.1;
  
  // North wall
  vertices.push(
    centerX - roomWidth/2, floorLevel, centerZ - roomDepth/2,
    centerX + roomWidth/2, floorLevel, centerZ - roomDepth/2,
    centerX + roomWidth/2, floorLevel + roomHeight, centerZ - roomDepth/2,
    centerX - roomWidth/2, floorLevel + roomHeight, centerZ - roomDepth/2
  );
  normals.push(...Array(4).fill([0, 0, -1]).flat());
  
  // South wall
  vertices.push(
    centerX + roomWidth/2, floorLevel, centerZ + roomDepth/2,
    centerX - roomWidth/2, floorLevel, centerZ + roomDepth/2,
    centerX - roomWidth/2, floorLevel + roomHeight, centerZ + roomDepth/2,
    centerX + roomWidth/2, floorLevel + roomHeight, centerZ + roomDepth/2
  );
  normals.push(...Array(4).fill([0, 0, 1]).flat());
  
  // East wall
  vertices.push(
    centerX + roomWidth/2, floorLevel, centerZ - roomDepth/2,
    centerX + roomWidth/2, floorLevel, centerZ + roomDepth/2,
    centerX + roomWidth/2, floorLevel + roomHeight, centerZ + roomDepth/2,
    centerX + roomWidth/2, floorLevel + roomHeight, centerZ - roomDepth/2
  );
  normals.push(...Array(4).fill([1, 0, 0]).flat());
  
  // West wall
  vertices.push(
    centerX - roomWidth/2, floorLevel, centerZ + roomDepth/2,
    centerX - roomWidth/2, floorLevel, centerZ - roomDepth/2,
    centerX - roomWidth/2, floorLevel + roomHeight, centerZ - roomDepth/2,
    centerX - roomWidth/2, floorLevel + roomHeight, centerZ + roomDepth/2
  );
  normals.push(...Array(4).fill([-1, 0, 0]).flat());
  
  // Ceiling
  const ceilingY = floorLevel + roomHeight;
  vertices.push(
    centerX - roomWidth/2, ceilingY, centerZ + roomDepth/2,
    centerX + roomWidth/2, ceilingY, centerZ + roomDepth/2,
    centerX + roomWidth/2, ceilingY, centerZ - roomDepth/2,
    centerX - roomWidth/2, ceilingY, centerZ - roomDepth/2
  );
  normals.push(...Array(4).fill([0, -1, 0]).flat());
  
  return {
    vertices,
    normals,
    materials: [getRoomMaterial(roomType)],
    roomCenter: { x: centerX, y: floorLevel + roomHeight/2, z: centerZ },
    roomType
  };
}

// Generate furniture based on room type
export function generateRoomFurniture(
  roomGeometry: Room3DGeometry,
  roomType: string
): { vertices: number[]; normals: number[] } {
  const vertices = [];
  const normals = [];
  const { x, y, z } = roomGeometry.roomCenter;
  
  switch (roomType) {
    case 'bedroom':
      // Add a bed
      const bedGeometry = generateBed(x - 0.5, y - 1.2, z);
      vertices.push(...bedGeometry.vertices);
      normals.push(...bedGeometry.normals);
      break;
      
    case 'bathroom':
      // Add toilet and sink
      const toiletGeometry = generateToilet(x - 0.4, y - 1.2, z - 0.3);
      const sinkGeometry = generateSink(x + 0.4, y - 0.8, z - 0.4);
      vertices.push(...toiletGeometry.vertices, ...sinkGeometry.vertices);
      normals.push(...toiletGeometry.normals, ...sinkGeometry.normals);
      break;
      
    case 'kitchen':
      // Add counter and appliances
      const counterGeometry = generateKitchenCounter(x, y - 1.2, z - 0.5);
      vertices.push(...counterGeometry.vertices);
      normals.push(...counterGeometry.normals);
      break;
      
    case 'living_room':
      // Add sofa
      const sofaGeometry = generateSofa(x, y - 1.2, z);
      vertices.push(...sofaGeometry.vertices);
      normals.push(...sofaGeometry.normals);
      break;
  }
  
  return { vertices, normals };
}

// Generate hallways between rooms
export function generateHallwayConnections(rooms: Room3DGeometry[]): { vertices: number[]; normals: number[] } {
  const vertices = [];
  const normals = [];
  
  for (let i = 0; i < rooms.length - 1; i++) {
    const room1 = rooms[i];
    const room2 = rooms[i + 1];
    
    // Calculate if rooms are adjacent
    const distance = Math.sqrt(
      Math.pow(room1.roomCenter.x - room2.roomCenter.x, 2) +
      Math.pow(room1.roomCenter.z - room2.roomCenter.z, 2)
    );
    
    // If rooms are close enough, create a hallway
    if (distance < 5) {
      const hallwayGeometry = generateHallway(room1.roomCenter, room2.roomCenter);
      vertices.push(...hallwayGeometry.vertices);
      normals.push(...hallwayGeometry.normals);
    }
  }
  
  return { vertices, normals };
}

// Helper functions for room heights
function getRoomHeight(roomType: string): number {
  const heights: Record<string, number> = {
    'bathroom': 2.4,
    'bedroom': 2.7,
    'kitchen': 2.7,
    'living_room': 3.0,
    'hallway': 2.5,
    'room': 2.7
  };
  return heights[roomType] || 2.7;
}

// Helper functions for room materials
function getRoomMaterial(roomType: string) {
  const materials: Record<string, { color: [number, number, number]; roughness: number; metallic: number }> = {
    'bathroom': { color: [0.9, 0.95, 1.0], roughness: 0.3, metallic: 0.1 },
    'bedroom': { color: [1.0, 0.95, 0.9], roughness: 0.8, metallic: 0.0 },
    'kitchen': { color: [0.95, 0.95, 0.95], roughness: 0.4, metallic: 0.2 },
    'living_room': { color: [0.98, 0.96, 0.94], roughness: 0.6, metallic: 0.0 },
    'hallway': { color: [0.92, 0.92, 0.92], roughness: 0.5, metallic: 0.0 },
    'room': { color: [0.95, 0.95, 0.95], roughness: 0.6, metallic: 0.0 }
  };
  return materials[roomType] || materials['room'];
}

// Simple furniture geometry generators
function generateBed(x: number, y: number, z: number) {
  const vertices = [
    x-0.8, y, z-1.0,  x+0.8, y, z-1.0,  x+0.8, y+0.3, z-1.0,  x-0.8, y+0.3, z-1.0,
    x-0.8, y, z+1.0,  x+0.8, y, z+1.0,  x+0.8, y+0.3, z+1.0,  x-0.8, y+0.3, z+1.0
  ];
  const normals = Array(8).fill([0, 1, 0]).flat();
  return { vertices, normals };
}

function generateToilet(x: number, y: number, z: number) {
  const vertices = [
    x-0.2, y, z-0.3,  x+0.2, y, z-0.3,  x+0.2, y+0.4, z-0.3,  x-0.2, y+0.4, z-0.3,
    x-0.2, y, z+0.3,  x+0.2, y, z+0.3,  x+0.2, y+0.4, z+0.3,  x-0.2, y+0.4, z+0.3
  ];
  const normals = Array(8).fill([0, 1, 0]).flat();
  return { vertices, normals };
}

function generateSink(x: number, y: number, z: number) {
  const vertices = [
    x-0.3, y, z-0.2,  x+0.3, y, z-0.2,  x+0.3, y+0.2, z-0.2,  x-0.3, y+0.2, z-0.2,
    x-0.3, y, z+0.2,  x+0.3, y, z+0.2,  x+0.3, y+0.2, z+0.2,  x-0.3, y+0.2, z+0.2
  ];
  const normals = Array(8).fill([0, 1, 0]).flat();
  return { vertices, normals };
}

function generateKitchenCounter(x: number, y: number, z: number) {
  const vertices = [
    x-1.5, y, z-0.3,  x+1.5, y, z-0.3,  x+1.5, y+0.9, z-0.3,  x-1.5, y+0.9, z-0.3,
    x-1.5, y, z+0.3,  x+1.5, y, z+0.3,  x+1.5, y+0.9, z+0.3,  x-1.5, y+0.9, z+0.3
  ];
  const normals = Array(8).fill([0, 1, 0]).flat();
  return { vertices, normals };
}

function generateSofa(x: number, y: number, z: number) {
  const vertices = [
    x-1.0, y, z-0.4,  x+1.0, y, z-0.4,  x+1.0, y+0.6, z-0.4,  x-1.0, y+0.6, z-0.4,
    x-1.0, y, z+0.4,  x+1.0, y, z+0.4,  x+1.0, y+0.6, z+0.4,  x-1.0, y+0.6, z+0.4
  ];
  const normals = Array(8).fill([0, 1, 0]).flat();
  return { vertices, normals };
}

function generateHallway(center1: {x: number, y: number, z: number}, center2: {x: number, y: number, z: number}) {
  const midX = (center1.x + center2.x) / 2;
  const midZ = (center1.z + center2.z) / 2;
  const width = 1.0;
  
  const vertices = [
    midX-width/2, center1.y-1.2, midZ-width/2,
    midX+width/2, center1.y-1.2, midZ-width/2,
    midX+width/2, center1.y-1.2, midZ+width/2,
    midX-width/2, center1.y-1.2, midZ+width/2
  ];
  const normals = Array(4).fill([0, 1, 0]).flat();
  return { vertices, normals };
}