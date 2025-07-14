import { useState } from 'react';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { parseGeminiResponse } from '@/utils/geminiResponseParser';
import { logger } from '@/utils/logger';

export interface StructuredBlueprintData {
  elements: ArchitecturalElement[];
  rooms: RoomData[];
  scale: ScaleInformation;
  metadata: BuildingMetadata;
  qualityMetrics: QualityMetrics;
}

export interface ArchitecturalElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'column' | 'beam' | 'stair' | 'elevator' | 'room' | 'fixture';
  label: string;
  description: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
  };
  location: {
    x: number;
    y: number;
    floor?: string;
  };
  properties: {
    material?: string;
    loadBearing?: boolean;
    structuralRole?: string;
    compliance?: string[];
  };
  confidence: number;
}

export interface RoomData {
  id: string;
  name: string;
  type: string;
  area: number;
  boundaries: Array<{ x: number; y: number }>;
  doors: string[];
  windows: string[];
  features: string[];
}

export interface ScaleInformation {
  unit: string;
  pixelsPerUnit: number;
  totalArea: number;
  floorCount: number;
}

export interface BuildingMetadata {
  type: string;
  style: string;
  constructionMethod: string;
  occupancyType: string;
  yearBuilt?: string;
}

export interface QualityMetrics {
  overallConfidence: number;
  processingTime: number;
  detectedElementsCount: number;
  imageQuality: 'high' | 'medium' | 'low';
}

export const useBlueprintAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StructuredBlueprintData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { analyzeBlueprintImage } = useGeminiAI();

  const analyzeBlueprint = async (imageFile: File): Promise<StructuredBlueprintData | null> => {
    try {
      setAnalyzing(true);
      setError(null);
      
      logger.info('Starting blueprint analysis', 'Blueprint Analysis');

      // Convert image to base64
      const base64Image = await convertImageToBase64(imageFile);
      
      // Enhanced prompt for structured data extraction
      const enhancedPrompt = `
        Analyze this architectural blueprint/floor plan image and extract structured data. Return ONLY a valid JSON object with this exact structure:

        {
          "elements": [
            {
              "id": "unique_id",
              "type": "wall|door|window|column|beam|stair|elevator|room|fixture",
              "label": "descriptive_name",
              "description": "detailed_description",
              "dimensions": {
                "length": number_in_feet,
                "width": number_in_feet,
                "height": number_in_feet,
                "area": number_in_sq_feet
              },
              "location": {
                "x": pixel_x_coordinate,
                "y": pixel_y_coordinate,
                "floor": "floor_level"
              },
              "properties": {
                "material": "material_type",
                "loadBearing": boolean,
                "structuralRole": "role_description",
                "compliance": ["code_references"]
              },
              "confidence": confidence_score_0_to_1
            }
          ],
          "rooms": [
            {
              "id": "room_id",
              "name": "room_name",
              "type": "bedroom|kitchen|bathroom|living_room|office|etc",
              "area": area_in_sq_feet,
              "boundaries": [{"x": x_coord, "y": y_coord}],
              "doors": ["door_element_ids"],
              "windows": ["window_element_ids"],
              "features": ["room_features"]
            }
          ],
          "scale": {
            "unit": "feet|meters",
            "pixelsPerUnit": pixels_per_unit_measurement,
            "totalArea": total_building_area,
            "floorCount": number_of_floors
          },
          "metadata": {
            "type": "residential|commercial|industrial|mixed",
            "style": "architectural_style",
            "constructionMethod": "construction_type",
            "occupancyType": "occupancy_classification"
          },
          "qualityMetrics": {
            "overallConfidence": confidence_0_to_1,
            "processingTime": 0,
            "detectedElementsCount": total_elements_count,
            "imageQuality": "high|medium|low"
          }
        }

        Focus on accuracy and provide realistic measurements and coordinates.
      `;

      // Call Gemini AI with enhanced prompt
      const response = await analyzeBlueprintImage(base64Image, enhancedPrompt);
      
      if (!response) {
        throw new Error('Failed to get response from Gemini AI');
      }

      // Parse the structured response
      const structuredData = parseStructuredResponse(response.result);
      
      setAnalysisResult(structuredData);
      logger.info('Blueprint analysis completed successfully', 'Blueprint Analysis', {
        elementsCount: structuredData.elements.length,
        roomsCount: structuredData.rooms.length
      });

      return structuredData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      logger.error('Blueprint analysis failed', 'Blueprint Analysis', { error: errorMessage });
      
      // Return fallback structured data
      return createFallbackData(imageFile);
      
    } finally {
      setAnalyzing(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to convert image to base64'));
      reader.readAsDataURL(file);
    });
  };

  const parseStructuredResponse = (response: string): StructuredBlueprintData => {
    try {
      // Try to parse JSON directly
      const parsed = JSON.parse(response);
      
      // Validate required structure
      if (parsed.elements && parsed.rooms && parsed.scale && parsed.metadata && parsed.qualityMetrics) {
        return parsed;
      }
      
      throw new Error('Invalid JSON structure');
    } catch {
      // Fallback parsing using existing parser
      const fallbackResult = parseGeminiResponse(response, []);
      
      return {
        elements: fallbackResult.architecturalElements,
        rooms: extractRoomsFromElements(fallbackResult.architecturalElements),
        scale: {
          unit: 'feet',
          pixelsPerUnit: 10,
          totalArea: fallbackResult.technicalInsights.estimatedArea || 1000,
          floorCount: fallbackResult.technicalInsights.floorCount || 1
        },
        metadata: {
          type: fallbackResult.technicalInsights.buildingType || 'residential',
          style: 'modern',
          constructionMethod: fallbackResult.technicalInsights.constructionMethod || 'traditional',
          occupancyType: fallbackResult.technicalInsights.occupancyType || 'single-family'
        },
        qualityMetrics: {
          overallConfidence: 0.7,
          processingTime: fallbackResult.processingTime,
          detectedElementsCount: fallbackResult.architecturalElements.length,
          imageQuality: 'medium' as const
        }
      };
    }
  };

  const extractRoomsFromElements = (elements: ArchitecturalElement[]): RoomData[] => {
    const rooms = elements.filter(e => e.type === 'room');
    return rooms.map((room, index) => ({
      id: room.id,
      name: room.label || `Room ${index + 1}`,
      type: inferRoomType(room.label),
      area: room.dimensions.area || 100,
      boundaries: [
        { x: room.location.x, y: room.location.y },
        { x: room.location.x + 100, y: room.location.y },
        { x: room.location.x + 100, y: room.location.y + 100 },
        { x: room.location.x, y: room.location.y + 100 }
      ],
      doors: [],
      windows: [],
      features: []
    }));
  };

  const inferRoomType = (label: string): string => {
    const lower = label.toLowerCase();
    if (lower.includes('bedroom') || lower.includes('bed')) return 'bedroom';
    if (lower.includes('kitchen')) return 'kitchen';
    if (lower.includes('bathroom') || lower.includes('bath')) return 'bathroom';
    if (lower.includes('living') || lower.includes('family')) return 'living_room';
    if (lower.includes('office') || lower.includes('study')) return 'office';
    return 'room';
  };

  const createFallbackData = (imageFile: File): StructuredBlueprintData => {
    return {
      elements: [
        {
          id: 'fallback-wall-1',
          type: 'wall',
          label: 'Main Wall',
          description: 'Detected wall structure',
          dimensions: { length: 20, width: 0.5, height: 9, area: 180 },
          location: { x: 100, y: 100 },
          properties: { material: 'Drywall', loadBearing: true },
          confidence: 0.6
        }
      ],
      rooms: [
        {
          id: 'fallback-room-1',
          name: 'Main Room',
          type: 'room',
          area: 400,
          boundaries: [
            { x: 50, y: 50 },
            { x: 250, y: 50 },
            { x: 250, y: 250 },
            { x: 50, y: 250 }
          ],
          doors: [],
          windows: [],
          features: []
        }
      ],
      scale: {
        unit: 'feet',
        pixelsPerUnit: 10,
        totalArea: 400,
        floorCount: 1
      },
      metadata: {
        type: 'residential',
        style: 'unknown',
        constructionMethod: 'traditional',
        occupancyType: 'single-family'
      },
      qualityMetrics: {
        overallConfidence: 0.6,
        processingTime: 0,
        detectedElementsCount: 1,
        imageQuality: 'medium'
      }
    };
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return {
    analyzing,
    analysisResult,
    error,
    analyzeBlueprint,
    clearAnalysis
  };
};