// Architectural geometry generation functions for creating realistic 3D building models

export function generateFloorGeometry(width: number, depth: number): number[] {
  return [
    -width/2, -1, -depth/2,  // Bottom-left-back
    width/2, -1, -depth/2,   // Bottom-right-back  
    width/2, -1, depth/2,    // Bottom-right-front
    -width/2, -1, depth/2,   // Bottom-left-front
  ];
}

export function generateWallGeometry(wall: any, buildingWidth: number, buildingDepth: number, buildingHeight: number, wallIndex: number) {
  const { bbox } = wall;
  
  // Position walls around the building perimeter
  const isVertical = wallIndex % 2 === 0;
  const wallThickness = 0.2;
  
  let vertices: number[];
  let normals: number[];
  
  if (isVertical) {
    // North/South walls
    const x = wallIndex === 0 ? -buildingWidth/2 : buildingWidth/2;
    vertices = [
      x, -1, -buildingDepth/2,
      x, buildingHeight, -buildingDepth/2,
      x, buildingHeight, buildingDepth/2,
      x, -1, buildingDepth/2
    ];
    normals = Array(4).fill(wallIndex === 0 ? [-1, 0, 0] : [1, 0, 0]).flat();
  } else {
    // East/West walls  
    const z = wallIndex === 1 ? -buildingDepth/2 : buildingDepth/2;
    vertices = [
      -buildingWidth/2, -1, z,
      buildingWidth/2, -1, z,
      buildingWidth/2, buildingHeight, z,
      -buildingWidth/2, buildingHeight, z
    ];
    normals = Array(4).fill(wallIndex === 1 ? [0, 0, -1] : [0, 0, 1]).flat();
  }
  
  return { vertices, normals };
}

export function generateDoorGeometry(door: any, buildingWidth: number, buildingDepth: number, buildingHeight: number, doorIndex: number) {
  const doorWidth = 1.2;
  const doorHeight = 2.4;
  
  // Position doors on different walls
  const wallSide = doorIndex % 4;
  let vertices: number[];
  let normals: number[];
  
  switch (wallSide) {
    case 0: // Front wall
      vertices = [
        -doorWidth/2, -1, buildingDepth/2 + 0.1,
        doorWidth/2, -1, buildingDepth/2 + 0.1,
        doorWidth/2, doorHeight, buildingDepth/2 + 0.1,
        -doorWidth/2, doorHeight, buildingDepth/2 + 0.1
      ];
      normals = Array(4).fill([0, 0, 1]).flat();
      break;
    case 1: // Right wall
      vertices = [
        buildingWidth/2 + 0.1, -1, -doorWidth/2,
        buildingWidth/2 + 0.1, -1, doorWidth/2,
        buildingWidth/2 + 0.1, doorHeight, doorWidth/2,
        buildingWidth/2 + 0.1, doorHeight, -doorWidth/2
      ];
      normals = Array(4).fill([1, 0, 0]).flat();
      break;
    case 2: // Back wall
      vertices = [
        doorWidth/2, -1, -buildingDepth/2 - 0.1,
        -doorWidth/2, -1, -buildingDepth/2 - 0.1,
        -doorWidth/2, doorHeight, -buildingDepth/2 - 0.1,
        doorWidth/2, doorHeight, -buildingDepth/2 - 0.1
      ];
      normals = Array(4).fill([0, 0, -1]).flat();
      break;
    default: // Left wall
      vertices = [
        -buildingWidth/2 - 0.1, -1, doorWidth/2,
        -buildingWidth/2 - 0.1, -1, -doorWidth/2,
        -buildingWidth/2 - 0.1, doorHeight, -doorWidth/2,
        -buildingWidth/2 - 0.1, doorHeight, doorWidth/2
      ];
      normals = Array(4).fill([-1, 0, 0]).flat();
  }
  
  return { vertices, normals };
}

export function generateWindowGeometry(window: any, buildingWidth: number, buildingDepth: number, buildingHeight: number, windowIndex: number) {
  const windowWidth = 1.5;
  const windowHeight = 1.2;
  const windowY = buildingHeight * 0.4; // Position windows at 40% of wall height
  
  // Position windows on different walls, avoiding door positions
  const wallSide = windowIndex % 4;
  const offsetX = (windowIndex % 3 - 1) * 2; // Spread windows across wall
  
  let vertices: number[];
  let normals: number[];
  
  switch (wallSide) {
    case 0: // Front wall
      vertices = [
        offsetX - windowWidth/2, windowY, buildingDepth/2 + 0.05,
        offsetX + windowWidth/2, windowY, buildingDepth/2 + 0.05,
        offsetX + windowWidth/2, windowY + windowHeight, buildingDepth/2 + 0.05,
        offsetX - windowWidth/2, windowY + windowHeight, buildingDepth/2 + 0.05
      ];
      normals = Array(4).fill([0, 0, 1]).flat();
      break;
    case 1: // Right wall
      vertices = [
        buildingWidth/2 + 0.05, windowY, offsetX - windowWidth/2,
        buildingWidth/2 + 0.05, windowY, offsetX + windowWidth/2,
        buildingWidth/2 + 0.05, windowY + windowHeight, offsetX + windowWidth/2,
        buildingWidth/2 + 0.05, windowY + windowHeight, offsetX - windowWidth/2
      ];
      normals = Array(4).fill([1, 0, 0]).flat();
      break;
    case 2: // Back wall
      vertices = [
        offsetX + windowWidth/2, windowY, -buildingDepth/2 - 0.05,
        offsetX - windowWidth/2, windowY, -buildingDepth/2 - 0.05,
        offsetX - windowWidth/2, windowY + windowHeight, -buildingDepth/2 - 0.05,
        offsetX + windowWidth/2, windowY + windowHeight, -buildingDepth/2 - 0.05
      ];
      normals = Array(4).fill([0, 0, -1]).flat();
      break;
    default: // Left wall
      vertices = [
        -buildingWidth/2 - 0.05, windowY, offsetX + windowWidth/2,
        -buildingWidth/2 - 0.05, windowY, offsetX - windowWidth/2,
        -buildingWidth/2 - 0.05, windowY + windowHeight, offsetX - windowWidth/2,
        -buildingWidth/2 - 0.05, windowY + windowHeight, offsetX + windowWidth/2
      ];
      normals = Array(4).fill([-1, 0, 0]).flat();
  }
  
  return { vertices, normals };
}

export function generateRoofGeometry(width: number, depth: number, height: number) {
  // Simple flat roof for now - could be enhanced with pitched roofs based on building type
  const roofHeight = height + 0.2;
  
  const vertices = [
    -width/2, roofHeight, -depth/2,  // Top-left-back
    width/2, roofHeight, -depth/2,   // Top-right-back
    width/2, roofHeight, depth/2,    // Top-right-front
    -width/2, roofHeight, depth/2,   // Top-left-front
  ];
  
  const normals = Array(4).fill([0, 1, 0]).flat(); // All normals point up
  
  return { vertices, normals };
}

export function generateWallIndices(startIndex: number, vertexCount: number): number[] {
  const indices = [];
  for (let i = 0; i < vertexCount - 2; i += 4) {
    // Create quads for each wall segment
    const base = startIndex + i;
    indices.push(
      base, base + 1, base + 2,    // First triangle
      base, base + 2, base + 3     // Second triangle
    );
  }
  return indices;
}

export function generateQuadIndices(startIndex: number, quadCount: number): number[] {
  const indices = [];
  for (let i = 0; i < quadCount; i++) {
    const base = startIndex + i * 4;
    indices.push(
      base, base + 1, base + 2,    // First triangle
      base, base + 2, base + 3     // Second triangle
    );
  }
  return indices;
}

export function generateRoofIndices(startIndex: number, vertexCount: number): number[] {
  // Generate triangular fan for roof (assuming 4 vertices for flat roof)
  return [
    startIndex, startIndex + 1, startIndex + 2,
    startIndex, startIndex + 2, startIndex + 3
  ];
}