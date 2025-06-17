
import { useState, useCallback } from 'react';
import { useGeminiAnalyzer } from './useGeminiAnalyzer';

interface FloorPlanData {
  rooms: Array<{
    id: string;
    type: 'bedroom' | 'living_room' | 'kitchen' | 'bathroom' | 'hallway';
    bounds: { x: number; y: number; width: number; height: number };
    area: number;
  }>;
  walls: Array<{
    id: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
    thickness: number;
  }>;
  doors: Array<{
    id: string;
    position: { x: number; y: number };
    width: number;
    wallId: string;
  }>;
  windows: Array<{
    id: string;
    position: { x: number; y: number };
    width: number;
    wallId: string;
  }>;
  scale: number;
}

export const useBlueprintAnalysis = () => {
  const [enhancedAnalyzing, setEnhancedAnalyzing] = useState(false);
  const { analyzeBlueprint } = useGeminiAnalyzer();

  const generateFloorPlanData = useCallback((): FloorPlanData => {
    return {
      rooms: [
        {
          id: 'room-1',
          type: 'living_room',
          bounds: { x: 10, y: 20, width: 40, height: 30 },
          area: 25.6
        },
        {
          id: 'room-2',
          type: 'kitchen',
          bounds: { x: 55, y: 20, width: 30, height: 20 },
          area: 12.8
        },
        {
          id: 'room-3',
          type: 'bedroom',
          bounds: { x: 10, y: 55, width: 35, height: 25 },
          area: 18.7
        },
        {
          id: 'room-4',
          type: 'bathroom',
          bounds: { x: 50, y: 55, width: 20, height: 15 },
          area: 6.4
        },
        {
          id: 'room-5',
          type: 'hallway',
          bounds: { x: 10, y: 50, width: 75, height: 5 },
          area: 8.0
        }
      ],
      walls: [
        { id: 'wall-1', start: { x: 10, y: 20 }, end: { x: 85, y: 20 }, thickness: 0.2 },
        { id: 'wall-2', start: { x: 10, y: 20 }, end: { x: 10, y: 80 }, thickness: 0.2 },
        { id: 'wall-3', start: { x: 85, y: 20 }, end: { x: 85, y: 70 }, thickness: 0.2 },
        { id: 'wall-4', start: { x: 10, y: 80 }, end: { x: 70, y: 80 }, thickness: 0.2 },
        { id: 'wall-5', start: { x: 50, y: 20 }, end: { x: 50, y: 50 }, thickness: 0.15 },
        { id: 'wall-6', start: { x: 10, y: 50 }, end: { x: 85, y: 50 }, thickness: 0.15 }
      ],
      doors: [
        { id: 'door-1', position: { x: 30, y: 50 }, width: 0.9, wallId: 'wall-6' },
        { id: 'door-2', position: { x: 60, y: 50 }, width: 0.8, wallId: 'wall-6' },
        { id: 'door-3', position: { x: 50, y: 35 }, width: 0.8, wallId: 'wall-5' }
      ],
      windows: [
        { id: 'window-1', position: { x: 25, y: 20 }, width: 1.2, wallId: 'wall-1' },
        { id: 'window-2', position: { x: 70, y: 20 }, width: 1.0, wallId: 'wall-1' },
        { id: 'window-3', position: { x: 85, y: 35 }, width: 1.0, wallId: 'wall-3' }
      ],
      scale: 50
    };
  }, []);

  const performEnhancedAnalysis = useCallback(async (
    imageUrl: string,
    uploadId: string,
    existingDetections: any[]
  ) => {
    setEnhancedAnalyzing(true);

    try {
      const floorPlanData = generateFloorPlanData();
      const geminiAnalysis = await analyzeBlueprint(imageUrl, uploadId, existingDetections);

      return {
        floorPlanData,
        geminiAnalysis
      };
    } finally {
      setEnhancedAnalyzing(false);
    }
  }, [analyzeBlueprint, generateFloorPlanData]);

  return {
    enhancedAnalyzing,
    performEnhancedAnalysis
  };
};
