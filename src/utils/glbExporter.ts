import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoomWithDimensions } from './enhancedRoomDetection';
import { createExtrudedRoomGeometry } from './polygon3DGeometry';

export interface GLBExportOptions {
  extrudeHeight?: number;
  scale?: number;
  includeFoundation?: boolean;
  exportFormat?: 'glb' | 'gltf';
}

/**
 * Export rooms as GLB file for download
 */
export async function exportRoomsAsGLB(
  rooms: RoomWithDimensions[],
  uploadId: string,
  options: GLBExportOptions = {}
): Promise<Blob> {
  const {
    extrudeHeight = 2.5,
    scale = 0.01,
    includeFoundation = true,
    exportFormat = 'glb'
  } = options;

  // Create Three.js scene for export
  const scene = new THREE.Scene();
  
  // Calculate building bounds
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
  
  const buildingWidth = (maxX - minX) * scale;
  const buildingLength = (maxY - minY) * scale;

  // Add foundation if requested
  if (includeFoundation && rooms.length > 0) {
    const foundationGeometry = new THREE.BoxGeometry(
      buildingWidth + 2, 
      0.2, 
      buildingLength + 2
    );
    const foundationMaterial = new THREE.MeshLambertMaterial({ color: '#8B7355' });
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.set(0, -0.1, 0);
    foundation.name = 'Foundation';
    scene.add(foundation);
  }

  // Add each room as extruded geometry
  rooms.forEach((room, index) => {
    try {
      const extrudedRoom = createExtrudedRoomGeometry(room, extrudeHeight, scale);
      const roomMesh = new THREE.Mesh(extrudedRoom.geometry, extrudedRoom.material);
      
      // Position the room mesh at its center
      roomMesh.position.copy(extrudedRoom.center);
      roomMesh.name = room.name || `Room_${index + 1}`;
      
      // Add metadata as userData
      roomMesh.userData = {
        roomId: room.id,
        roomType: room.type,
        dimensions: room.realWorldDimensions || room.dimensions,
        confidence: room.confidence
      };
      
      scene.add(roomMesh);
    } catch (error) {
      console.warn(`Failed to add room ${room.name} to 3D export:`, error);
    }
  });

  // Export scene to GLB
  const exporter = new GLTFExporter();
  
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { 
          type: exportFormat === 'glb' ? 'model/gltf-binary' : 'model/gltf+json' 
        });
        resolve(blob);
      },
      (error) => {
        console.error('GLB export failed:', error);
        reject(error);
      },
      { binary: exportFormat === 'glb' }
    );
  });
}

/**
 * Download GLB file to user's device
 */
export function downloadGLB(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convenience function to export and download rooms as GLB
 */
export async function exportAndDownloadRooms(
  rooms: RoomWithDimensions[],
  uploadId: string,
  options: GLBExportOptions = {}
): Promise<void> {
  try {
    const blob = await exportRoomsAsGLB(rooms, uploadId, options);
    const filename = `floor_plan_${uploadId}.glb`;
    downloadGLB(blob, filename);
  } catch (error) {
    console.error('Failed to export and download GLB:', error);
    throw error;
  }
}