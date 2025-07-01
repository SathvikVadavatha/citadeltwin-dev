
import { DetectedObject, Plan2SceneResult } from '../types/processingTypes';
import { logger } from '@/utils/logger';

export const mapRoomTypeToLabel = (roomType: string): string => {
  const mapping: Record<string, string> = {
    'living_room': 'living room',
    'bedroom': 'bedroom',
    'kitchen': 'kitchen',
    'bathroom': 'bathroom',
    'dining_room': 'dining room',
    'office': 'office',
    'closet': 'closet',
    'hallway': 'hallway',
    'balcony': 'balcony',
    'laundry': 'laundry room'
  };
  
  return mapping[roomType?.toLowerCase()] || 'room';
};

export const mapElementTypeToLabel = (elementType: string): string => {
  const mapping: Record<string, string> = {
    'door': 'door',
    'window': 'window',
    'sink': 'sink',
    'toilet': 'toilet',
    'bathtub': 'bathtub',
    'shower': 'shower',
    'stove': 'stove',
    'refrigerator': 'refrigerator',
    'bed': 'bed',
    'sofa': 'sofa',
    'table': 'table',
    'cabinet': 'cabinet'
  };
  
  return mapping[elementType?.toLowerCase()] || 'fixture';
};

export const convertPlan2SceneToDetectedObjects = (plan2sceneResult: Plan2SceneResult): DetectedObject[] => {
  const detectedObjects: DetectedObject[] = [];

  logger.info('🔍 Converting Plan2Scene results to DetectedObjects', 'Data Conversion', {
    hasRooms: !!plan2sceneResult.rooms,
    hasWalls: !!plan2sceneResult.walls,
    roomCount: plan2sceneResult.rooms?.length || 0,
    wallCount: plan2sceneResult.walls?.length || 0
  });

  // Convert rooms to detected objects
  if (plan2sceneResult.rooms && Array.isArray(plan2sceneResult.rooms) && plan2sceneResult.rooms.length > 0) {
    logger.info(`🏠 Converting ${plan2sceneResult.rooms.length} rooms from Plan2Scene`, 'Data Conversion');
    
    plan2sceneResult.rooms.forEach((room: any, index: number) => {
      // Handle different room data structures from Plan2Scene
      const roomBounds = room.bounds || room.bbox || { 
        x: (index % 3) * 30, 
        y: Math.floor(index / 3) * 25, 
        width: 25, 
        height: 20 
      };
      
      detectedObjects.push({
        label: mapRoomTypeToLabel(room.type || 'room'),
        confidence: Math.max(0.75, room.confidence || 0.80),
        bbox: {
          x: roomBounds.x || 0,
          y: roomBounds.y || 0,
          width: roomBounds.width || 25,
          height: roomBounds.height || 20
        }
      });
    });
  }

  // Convert walls to detected objects
  if (plan2sceneResult.walls && Array.isArray(plan2sceneResult.walls) && plan2sceneResult.walls.length > 0) {
    logger.info(`🧱 Converting ${plan2sceneResult.walls.length} walls from Plan2Scene`, 'Data Conversion');
    
    plan2sceneResult.walls.forEach((wall: any, index: number) => {
      // Handle different wall data structures
      const wallStart = wall.start || { x: index * 15, y: 5 };
      const wallEnd = wall.end || { x: (index * 15) + 12, y: 5 };
      
      detectedObjects.push({
        label: "wall",
        confidence: Math.max(0.80, wall.confidence || 0.85),
        bbox: {
          x: wallStart.x || 0,
          y: wallStart.y || 0,
          width: Math.abs((wallEnd.x || 12) - (wallStart.x || 0)) || 12,
          height: Math.abs((wallEnd.y || 2) - (wallStart.y || 0)) || 2
        }
      });
    });
  }

  // Add any additional elements from Plan2Scene
  if (plan2sceneResult.elements && Array.isArray(plan2sceneResult.elements)) {
    plan2sceneResult.elements.forEach((element: any) => {
      detectedObjects.push({
        label: mapElementTypeToLabel(element.type || 'fixture'),
        confidence: Math.max(0.70, element.confidence || 0.75),
        bbox: {
          x: element.position?.x || element.x || 0,
          y: element.position?.y || element.y || 0,
          width: element.size?.width || element.width || 5,
          height: element.size?.height || element.height || 5
        }
      });
    });
  }

  logger.info('✅ Plan2Scene conversion completed successfully!', 'Data Conversion', {
    totalObjectsConverted: detectedObjects.length,
    roomsConverted: plan2sceneResult.rooms?.length || 0,
    wallsConverted: plan2sceneResult.walls?.length || 0,
    elementsConverted: plan2sceneResult.elements?.length || 0
  });

  // Ensure we have at least some objects
  if (detectedObjects.length === 0) {
    logger.warn('⚠️ No objects converted from Plan2Scene data', 'Data Conversion', {
      plan2sceneKeys: Object.keys(plan2sceneResult)
    });
    throw new Error('Plan2Scene returned data but no objects could be converted');
  }

  return detectedObjects;
};
