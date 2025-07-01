
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
  let conversionSuccess = false;

  logger.info('🔍 Processing enhanced Plan2Scene results', 'Data Conversion', {
    hasRooms: !!plan2sceneResult.rooms,
    hasWalls: !!plan2sceneResult.walls,
    hasStats: !!plan2sceneResult.processingStats,
    roomCount: plan2sceneResult.rooms?.length || 0,
    wallCount: plan2sceneResult.walls?.length || 0,
    fullResultKeys: Object.keys(plan2sceneResult),
    resultStructure: {
      rooms: plan2sceneResult.rooms?.slice(0, 2), // Sample first 2 rooms for structure
      walls: plan2sceneResult.walls?.slice(0, 2)  // Sample first 2 walls for structure
    }
  });

  // Convert rooms to detected objects
  if (plan2sceneResult.rooms && Array.isArray(plan2sceneResult.rooms) && plan2sceneResult.rooms.length > 0) {
    logger.info(`🏠 Converting ${plan2sceneResult.rooms.length} rooms from Plan2Scene`, 'Data Conversion');
    
    plan2sceneResult.rooms.forEach((room: any, index: number) => {
      logger.debug(`Converting room ${index + 1}:`, 'Data Conversion', {
        type: room.type,
        confidence: room.confidence,
        bounds: room.bounds,
        area: room.area
      });
      
      // Create room detection with proper bounds
      const roomBounds = room.bounds || { x: index * 15, y: index * 10, width: 15, height: 12 };
      detectedObjects.push({
        label: mapRoomTypeToLabel(room.type),
        confidence: Math.max(0.75, room.confidence || 0.80),
        bbox: {
          x: roomBounds.x || 0,
          y: roomBounds.y || 0,
          width: roomBounds.width || 15,
          height: roomBounds.height || 12
        }
      });
      conversionSuccess = true;
    });
  }

  // Convert walls to detected objects
  if (plan2sceneResult.walls && Array.isArray(plan2sceneResult.walls) && plan2sceneResult.walls.length > 0) {
    logger.info(`🧱 Converting ${plan2sceneResult.walls.length} walls from Plan2Scene`, 'Data Conversion');
    
    plan2sceneResult.walls.forEach((wall: any, index: number) => {
      logger.debug(`Converting wall ${index + 1}:`, 'Data Conversion', {
        start: wall.start,
        end: wall.end,
        confidence: wall.confidence
      });
      
      // Create wall detection with proper bounds
      const wallStart = wall.start || { x: index * 10, y: 5 };
      const wallEnd = wall.end || { x: (index * 10) + 8, y: 5 };
      
      detectedObjects.push({
        label: "wall",
        confidence: Math.max(0.80, wall.confidence || 0.85),
        bbox: {
          x: wallStart.x || 0,
          y: wallStart.y || 0,
          width: Math.abs((wallEnd.x || 8) - (wallStart.x || 0)) || 8,
          height: Math.abs((wallEnd.y || 1) - (wallStart.y || 0)) || 1
        }
      });
      conversionSuccess = true;
    });
  }

  // Validate conversion success
  if (!conversionSuccess || detectedObjects.length === 0) {
    logger.error('❌ Plan2Scene returned data but conversion to detectedObjects failed', 'Data Conversion', {
      hasRooms: !!plan2sceneResult.rooms,
      hasWalls: !!plan2sceneResult.walls,
      roomsLength: plan2sceneResult.rooms?.length || 0,
      wallsLength: plan2sceneResult.walls?.length || 0,
      detectedObjectsLength: detectedObjects.length,
      conversionSuccess
    });
    throw new Error('Plan2Scene analysis completed but data conversion to detectedObjects failed - no valid room or wall data found');
  }

  logger.info('🎉 Plan2Scene processing and conversion successful!', 'Data Conversion', {
    objectsCount: detectedObjects.length,
    roomCount: plan2sceneResult.rooms?.length || 0,
    wallCount: plan2sceneResult.walls?.length || 0,
    conversionSuccess: true,
    qualityMetrics: plan2sceneResult.qualityMetrics
  });

  return detectedObjects;
};
