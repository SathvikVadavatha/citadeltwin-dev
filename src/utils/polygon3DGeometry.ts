import * as THREE from 'three';
import { RoomWithDimensions } from './enhancedRoomDetection';

export interface ExtrudedRoomGeometry {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  center: THREE.Vector3;
  labelPosition: THREE.Vector3;
}

/**
 * Convert Python-style polygon extrusion to Three.js geometry
 * Matches the matplotlib implementation from the user's Python code
 */
export function createExtrudedRoomGeometry(
  room: RoomWithDimensions,
  extrudeHeight: number = 2.5,
  scale: number = 0.01
): ExtrudedRoomGeometry {
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  
  // Convert room points to 3D coordinates (scale from pixels to world units)
  const bottomVertices = room.points.map(point => new THREE.Vector3(
    point.x * scale,
    0,
    point.y * scale
  ));
  
  const topVertices = room.points.map(point => new THREE.Vector3(
    point.x * scale,
    extrudeHeight,
    point.y * scale
  ));

  // Calculate room center for positioning and labeling
  const centerX = room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length * scale;
  const centerZ = room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length * scale;
  const center = new THREE.Vector3(centerX, 0, centerZ);
  const labelPosition = new THREE.Vector3(centerX, extrudeHeight / 2 + 0.2, centerZ);

  let vertexIndex = 0;

  // Add bottom face vertices (like Python: only bottom, skip top to "see inside")
  for (const vertex of bottomVertices) {
    vertices.push(vertex.x - centerX, vertex.y, vertex.z - centerZ);
    normals.push(0, -1, 0); // Normal pointing down
  }

  // Create bottom face indices (triangulate the polygon)
  if (bottomVertices.length >= 3) {
    for (let i = 1; i < bottomVertices.length - 1; i++) {
      indices.push(0, i, i + 1);
    }
  }
  vertexIndex += bottomVertices.length;

  // Add side wall vertices and faces
  for (let i = 0; i < bottomVertices.length; i++) {
    const next = (i + 1) % bottomVertices.length;
    
    const bottom1 = bottomVertices[i];
    const bottom2 = bottomVertices[next];
    const top1 = topVertices[i];
    const top2 = topVertices[next];

    // Calculate wall normal (pointing outward)
    const edge = new THREE.Vector3().subVectors(bottom2, bottom1);
    const normal = new THREE.Vector3(-edge.z, 0, edge.x).normalize();

    // Add 4 vertices for this wall segment (quad)
    vertices.push(
      bottom1.x - centerX, bottom1.y, bottom1.z - centerZ,
      bottom2.x - centerX, bottom2.y, bottom2.z - centerZ,
      top2.x - centerX, top2.y, top2.z - centerZ,
      top1.x - centerX, top1.y, top1.z - centerZ
    );

    // Add normals for all 4 vertices
    for (let j = 0; j < 4; j++) {
      normals.push(normal.x, normal.y, normal.z);
    }

    // Add indices for two triangles forming the wall quad
    const baseIdx = vertexIndex;
    indices.push(
      baseIdx, baseIdx + 1, baseIdx + 2,     // First triangle
      baseIdx, baseIdx + 2, baseIdx + 3      // Second triangle
    );
    
    vertexIndex += 4;
  }

  // Create BufferGeometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  // Create material based on room type (matching Python colors)
  const material = createRoomMaterial(room.type, room.name);

  return {
    geometry,
    material,
    center,
    labelPosition
  };
}

/**
 * Create room material based on type - matches Python matplotlib colors
 */
function createRoomMaterial(roomType: string, roomLabel: string): THREE.Material {
  // Default room color from Python: '#90caf9' (light blue)
  let color = '#90caf9';
  
  // Door/opening color from Python: '#ffcccb' (light red)
  if (roomLabel.toLowerCase().includes('door') || roomType === 'hallway') {
    color = '#ffcccb';
  }
  
  // Additional room type colors for variety
  const roomTypeColors: Record<string, string> = {
    bedroom: '#90caf9',
    bathroom: '#b39ddb',
    kitchen: '#a5d6a7',
    living_room: '#ffcc80',
    dining_room: '#f48fb1',
    office: '#80deea',
    closet: '#c5e1a5',
    garage: '#ffab91',
    utility: '#d7ccc8',
    toilet: '#f8bbd9',
    hallway: '#ffcccb',
    room: '#90caf9'
  };

  if (roomTypeColors[roomType]) {
    color = roomTypeColors[roomType];
  }

  return new THREE.MeshLambertMaterial({
    color: color,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide // Show both sides for interior viewing
  });
}

/**
 * Create a simple room wireframe for debugging/visualization
 */
export function createRoomWireframe(
  room: RoomWithDimensions,
  extrudeHeight: number = 2.5,
  scale: number = 0.01
): THREE.LineSegments {
  const points: THREE.Vector3[] = [];
  
  // Calculate center for positioning
  const centerX = room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length * scale;
  const centerZ = room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length * scale;

  // Bottom edges
  for (let i = 0; i < room.points.length; i++) {
    const current = room.points[i];
    const next = room.points[(i + 1) % room.points.length];
    
    points.push(new THREE.Vector3(current.x * scale - centerX, 0, current.y * scale - centerZ));
    points.push(new THREE.Vector3(next.x * scale - centerX, 0, next.y * scale - centerZ));
  }

  // Top edges
  for (let i = 0; i < room.points.length; i++) {
    const current = room.points[i];
    const next = room.points[(i + 1) % room.points.length];
    
    points.push(new THREE.Vector3(current.x * scale - centerX, extrudeHeight, current.y * scale - centerZ));
    points.push(new THREE.Vector3(next.x * scale - centerX, extrudeHeight, next.y * scale - centerZ));
  }

  // Vertical edges
  for (const point of room.points) {
    points.push(new THREE.Vector3(point.x * scale - centerX, 0, point.y * scale - centerZ));
    points.push(new THREE.Vector3(point.x * scale - centerX, extrudeHeight, point.y * scale - centerZ));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
  
  return new THREE.LineSegments(geometry, material);
}