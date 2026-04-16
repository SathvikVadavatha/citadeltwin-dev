// Phase 4: Blueprint-Specific 3D Geometry Generation Helpers

export interface BuildingCharacteristics {
  width: number;
  depth: number;
  height: number;
  buildingType: string;
  architecturalStyle: string;
  complexity: number;
  footprint: { x: number; y: number; width: number; height: number };
}

export function calculateBuildingCharacteristics(
  allObjects: any[],
  walls: any[],
  rooms: any[],
  isAIGenerated: boolean,
  rng: any
): BuildingCharacteristics {
  // Analyze actual object bounding boxes to determine real building dimensions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  allObjects.forEach(obj => {
    if (obj.bbox) {
      minX = Math.min(minX, obj.bbox.x);
      minY = Math.min(minY, obj.bbox.y);
      maxX = Math.max(maxX, obj.bbox.x + obj.bbox.width);
      maxY = Math.max(maxY, obj.bbox.y + obj.bbox.height);
    }
  });
  
  // Use actual building footprint if detected, otherwise intelligent defaults
  const footprintWidth = isFinite(maxX - minX) ? maxX - minX : 50 + rng.next() * 30;
  const footprintDepth = isFinite(maxY - minY) ? maxY - minY : 40 + rng.next() * 25;
  
  // Scale factors based on detected complexity
  const complexity = Math.min(allObjects.length / 10, 3);
  const scaleFactor = 0.5 + complexity * 0.3; // 0.5 to 1.4 scale
  
  const buildingWidth = Math.max(12, Math.min(35, footprintWidth * scaleFactor));
  const buildingDepth = Math.max(10, Math.min(30, footprintDepth * scaleFactor));
  
  // Determine building type from detected elements
  const buildingType = determineBuildingTypeFromObjects(allObjects);
  const architecturalStyle = determineArchitecturalStyleFromObjects(allObjects, rng);
  
  // Height based on building type and detected elements
  let buildingHeight = 3.5; // Default residential height
  if (buildingType.includes('commercial')) {
    buildingHeight = 4.5 + rng.next() * 2;
  } else if (buildingType === 'industrial') {
    buildingHeight = 6 + rng.next() * 3;
  } else if (buildingType.includes('multi_family')) {
    buildingHeight = 3.5 + Math.floor(rooms.length / 4) * 3; // Multiple floors
  }
  
  return {
    width: buildingWidth,
    depth: buildingDepth,
    height: buildingHeight,
    buildingType,
    architecturalStyle,
    complexity,
    footprint: {
      x: isFinite(minX) ? minX : 0,
      y: isFinite(minY) ? minY : 0,
      width: footprintWidth,
      height: footprintDepth
    }
  };
}

function determineBuildingTypeFromObjects(objects: any[]): string {
  const labels = objects.map(obj => obj.label.toLowerCase());
  
  if (labels.some(l => l.includes('warehouse') || l.includes('loading'))) {
    return 'industrial';
  } else if (labels.some(l => l.includes('office') || l.includes('conference'))) {
    return 'commercial_office';
  } else if (labels.some(l => l.includes('bedroom')) && labels.filter(l => l.includes('bedroom')).length > 2) {
    return 'multi_family_residential';
  } else if (labels.some(l => l.includes('bedroom') || l.includes('kitchen'))) {
    return 'single_family_residential';
  }
  
  return labels.length > 8 ? 'mixed_use' : 'residential';
}

function determineArchitecturalStyleFromObjects(objects: any[], rng: any): string {
  const labels = objects.map(obj => obj.label.toLowerCase());
  const elementCount = objects.length;
  
  if (labels.some(l => l.includes('load_bearing') || l.includes('column') || l.includes('beam'))) {
    return rng.next() > 0.5 ? 'modern' : 'industrial';
  } else if (elementCount > 15) {
    return 'contemporary';
  } else if (elementCount < 8) {
    return 'minimalist';
  }
  
  return rng.choice(['modern', 'traditional', 'contemporary']);
}

export function generateBlueprintSpecificFoundation(
  structuralElements: any[],
  characteristics: BuildingCharacteristics,
  rng: any
): { vertices: number[]; normals: number[] } {
  const { width, depth, footprint } = characteristics;
  
  // Use actual foundation element if detected
  const foundationElement = structuralElements.find(el => el.label === 'foundation');
  let foundationWidth = width;
  let foundationDepth = depth;
  
  if (foundationElement && foundationElement.bbox) {
    foundationWidth = foundationElement.bbox.width * 0.5; // Scale blueprint to 3D
    foundationDepth = foundationElement.bbox.height * 0.5;
  }
  
  const thickness = 0.5 + rng.next() * 0.3;
  
  const vertices = [
    // Foundation base (slightly larger than building)
    -foundationWidth/2 - 1, -thickness, -foundationDepth/2 - 1,
     foundationWidth/2 + 1, -thickness, -foundationDepth/2 - 1,
     foundationWidth/2 + 1, -thickness,  foundationDepth/2 + 1,
    -foundationWidth/2 - 1, -thickness,  foundationDepth/2 + 1,
    
    // Foundation top
    -foundationWidth/2 - 1, 0, -foundationDepth/2 - 1,
     foundationWidth/2 + 1, 0, -foundationDepth/2 - 1,
     foundationWidth/2 + 1, 0,  foundationDepth/2 + 1,
    -foundationWidth/2 - 1, 0,  foundationDepth/2 + 1,
  ];
  
  const normals = [
    // Bottom face
    0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
    // Top face
    0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
  ];
  
  return { vertices, normals };
}

export function generateBlueprintSpecificWall(
  wallElement: any,
  characteristics: BuildingCharacteristics,
  index: number,
  rng: any
): { vertices: number[]; normals: number[] } {
  const { width, depth, height, buildingType } = characteristics;
  const bbox = wallElement.bbox;
  
  // Convert 2D blueprint coordinates to 3D world coordinates
  const scale = 0.4; // Scale factor from blueprint to 3D
  const wallX = (bbox.x - 40) * scale; // Center around origin
  const wallZ = (bbox.y - 40) * scale;
  const wallWidth = bbox.width * scale;
  const wallDepth = Math.max(0.3, bbox.height * scale * 0.2); // Wall thickness
  
  // Wall height based on building type
  const wallHeight = buildingType.includes('commercial') ? height * 1.1 : height;
  
  // Determine wall type from label
  const isExterior = wallElement.label.includes('exterior');
  const isLoadBearing = wallElement.label.includes('load_bearing');
  const thickness = isLoadBearing ? wallDepth * 1.5 : wallDepth;
  
  const vertices = [
    // Wall face 1
    wallX, 0, wallZ,
    wallX + wallWidth, 0, wallZ,
    wallX + wallWidth, wallHeight, wallZ,
    wallX, wallHeight, wallZ,
    
    // Wall face 2 (opposite side)
    wallX, 0, wallZ + thickness,
    wallX + wallWidth, 0, wallZ + thickness,
    wallX + wallWidth, wallHeight, wallZ + thickness,
    wallX, wallHeight, wallZ + thickness,
  ];
  
  const normals = [
    // Front face
    0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
    // Back face
    0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
  ];
  
  return { vertices, normals };
}

export function generateBlueprintSpecificDoor(
  doorElement: any,
  characteristics: BuildingCharacteristics,
  index: number,
  rng: any
): { vertices: number[]; normals: number[] } {
  const bbox = doorElement.bbox;
  const scale = 0.4;
  
  // Convert door position from blueprint to 3D
  const doorX = (bbox.x - 40) * scale;
  const doorZ = (bbox.y - 40) * scale - 0.1; // Slightly in front of wall
  const doorWidth = Math.max(2, bbox.width * scale * 0.3);
  const doorHeight = Math.max(2.5, Math.min(3, bbox.height * scale * 0.15));
  
  // Door type determines appearance
  const isMainEntrance = doorElement.label.includes('main') || doorElement.label.includes('front');
  const thickness = isMainEntrance ? 0.1 : 0.08;
  
  const vertices = [
    // Door frame
    doorX, 0, doorZ,
    doorX + doorWidth, 0, doorZ,
    doorX + doorWidth, doorHeight, doorZ,
    doorX, doorHeight, doorZ,
    
    // Door surface
    doorX + 0.05, 0.1, doorZ - thickness,
    doorX + doorWidth - 0.05, 0.1, doorZ - thickness,
    doorX + doorWidth - 0.05, doorHeight - 0.1, doorZ - thickness,
    doorX + 0.05, doorHeight - 0.1, doorZ - thickness,
  ];
  
  const normals = [
    // Frame
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Door
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  ];
  
  return { vertices, normals };
}

export function generateBlueprintSpecificWindow(
  windowElement: any,
  characteristics: BuildingCharacteristics,
  index: number,
  rng: any
): { vertices: number[]; normals: number[] } {
  const bbox = windowElement.bbox;
  const scale = 0.4;
  
  const windowX = (bbox.x - 40) * scale;
  const windowZ = (bbox.y - 40) * scale;
  const windowWidth = Math.max(1.5, bbox.width * scale * 0.25);
  const windowHeight = Math.max(1.2, bbox.height * scale * 0.2);
  const windowSillHeight = 0.8 + rng.next() * 0.4; // Realistic sill height
  
  const vertices = [
    // Window frame
    windowX, windowSillHeight, windowZ,
    windowX + windowWidth, windowSillHeight, windowZ,
    windowX + windowWidth, windowSillHeight + windowHeight, windowZ,
    windowX, windowSillHeight + windowHeight, windowZ,
    
    // Window glass (slightly recessed)
    windowX + 0.05, windowSillHeight + 0.05, windowZ - 0.05,
    windowX + windowWidth - 0.05, windowSillHeight + 0.05, windowZ - 0.05,
    windowX + windowWidth - 0.05, windowSillHeight + windowHeight - 0.05, windowZ - 0.05,
    windowX + 0.05, windowSillHeight + windowHeight - 0.05, windowZ - 0.05,
  ];
  
  const normals = [
    // Frame
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Glass
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  ];
  
  return { vertices, normals };
}

export function generateInteriorFeatures(
  roomElements: any[],
  characteristics: BuildingCharacteristics,
  rng: any
): { vertices: number[]; normals: number[] } {
  const vertices: number[] = [];
  const normals: number[] = [];
  const scale = 0.4;
  
  roomElements.forEach((room, index) => {
    const bbox = room.bbox;
    const roomX = (bbox.x - 40) * scale;
    const roomZ = (bbox.y - 40) * scale;
    const roomWidth = bbox.width * scale;
    const roomDepth = bbox.height * scale;
    
    // Add room-specific features
    if (room.label.includes('kitchen')) {
      // Kitchen island or counter
      const counterX = roomX + roomWidth * 0.3;
      const counterZ = roomZ + roomDepth * 0.4;
      const counterWidth = roomWidth * 0.4;
      const counterDepth = roomDepth * 0.2;
      const counterHeight = 0.9;
      
      vertices.push(
        // Counter top
        counterX, counterHeight, counterZ,
        counterX + counterWidth, counterHeight, counterZ,
        counterX + counterWidth, counterHeight, counterZ + counterDepth,
        counterX, counterHeight, counterZ + counterDepth
      );
      
      normals.push(
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0
      );
      
    } else if (room.label.includes('bathroom')) {
      // Bathroom fixtures
      const fixtureX = roomX + roomWidth * 0.2;
      const fixtureZ = roomZ + roomDepth * 0.2;
      const fixtureSize = Math.min(roomWidth, roomDepth) * 0.3;
      
      vertices.push(
        // Fixture base
        fixtureX, 0, fixtureZ,
        fixtureX + fixtureSize, 0, fixtureZ,
        fixtureX + fixtureSize, 0.5, fixtureZ,
        fixtureX, 0.5, fixtureZ
      );
      
      normals.push(
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0
      );
    }
  });
  
  return { vertices, normals };
}

export function generateBlueprintSpecificRoof(
  characteristics: BuildingCharacteristics,
  rng: any
): { vertices: number[]; normals: number[] } {
  const { width, depth, height, architecturalStyle } = characteristics;
  
  // Roof style based on architectural style and building type
  const isFlat = architecturalStyle === 'modern' || architecturalStyle === 'industrial';
  const roofHeight = isFlat ? 0.3 : 1.5 + rng.next() * 1;
  
  if (isFlat) {
    // Flat roof
    const vertices = [
      -width/2, height, -depth/2,
       width/2, height, -depth/2,
       width/2, height,  depth/2,
      -width/2, height,  depth/2,
      
      // Slight parapet
      -width/2, height + 0.3, -depth/2,
       width/2, height + 0.3, -depth/2,
       width/2, height + 0.3,  depth/2,
      -width/2, height + 0.3,  depth/2,
    ];
    
    const normals = [
      0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
      0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    ];
    
    return { vertices, normals };
  } else {
    // Pitched roof
    const vertices = [
      -width/2, height, -depth/2,
       width/2, height, -depth/2,
       0, height + roofHeight, 0,
       
       width/2, height, -depth/2,
       width/2, height,  depth/2,
       0, height + roofHeight, 0,
       
       width/2, height,  depth/2,
      -width/2, height,  depth/2,
       0, height + roofHeight, 0,
       
      -width/2, height,  depth/2,
      -width/2, height, -depth/2,
       0, height + roofHeight, 0,
    ];
    
    // Calculate normals for pitched surfaces
    const normals = [
      0, 0.7, -0.7,  0, 0.7, -0.7,  0, 0.7, -0.7,
      0.7, 0.7, 0,   0.7, 0.7, 0,   0.7, 0.7, 0,
      0, 0.7, 0.7,   0, 0.7, 0.7,   0, 0.7, 0.7,
      -0.7, 0.7, 0,  -0.7, 0.7, 0,  -0.7, 0.7, 0,
    ];
    
    return { vertices, normals };
  }
}