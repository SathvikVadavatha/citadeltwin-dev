import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
import { ExtractedTextData } from './textExtraction';

interface DetectedObject {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const processWithTextBasedGemini = async (extractedData: ExtractedTextData, imageUrl: string): Promise<DetectedObject[]> => {
  try {
    logger.info('🤖 Starting text-based Gemini AI processing', 'Text-Based AI', {
      textLength: extractedData.text.length,
      roomsFound: extractedData.structuredData.rooms.length,
      elementsFound: extractedData.structuredData.elements.length,
      confidence: extractedData.confidence
    });

    // Create intelligent prompt based on extracted text data
    const intelligentPrompt = createIntelligentPrompt(extractedData);
    
    logger.info('📝 Created intelligent prompt', 'Text-Based AI', {
      promptLength: intelligentPrompt.length,
      hasRoomData: extractedData.structuredData.rooms.length > 0,
      hasMeasurements: extractedData.dimensions.length > 0
    });

    // Call Gemini with text-based prompt (more reliable than vision)
    const { data: geminiResult, error: geminiError } = await supabase.functions.invoke('gemini-ai', {
      body: {
        prompt: intelligentPrompt,
        type: 'architectural-modeling',
        context: 'Professional blueprint analysis for 3D model generation using extracted text data',
        maxTokens: 3000
      }
    });

    if (geminiError) {
      logger.error('❌ Text-based Gemini AI call failed', 'Text-Based AI', {
        error: geminiError.message
      });
      throw new Error(`Text-based Gemini AI failed: ${geminiError.message}`);
    }

    if (!geminiResult || !geminiResult.result) {
      throw new Error('Empty response from text-based Gemini AI');
    }

    logger.info('✅ Text-based Gemini AI response received', 'Text-Based AI');
    
    // Parse the structured response
    const detectedObjects = parseTextBasedGeminiResults(geminiResult.result, extractedData);
    
    logger.info('🎯 Text-based processing completed successfully', 'Text-Based AI', {
      objectsGenerated: detectedObjects.length,
      objectTypes: detectedObjects.map(obj => obj.label).slice(0, 5)
    });

    return detectedObjects;

  } catch (error) {
    logger.error('💥 Text-based Gemini processing error', 'Text-Based AI', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

const createIntelligentPrompt = (extractedData: ExtractedTextData): string => {
  const { structuredData, dimensions, roomLabels, annotations, scaleInfo } = extractedData;
  
  let prompt = `You are an expert architect creating a detailed 3D building model from blueprint text analysis.

EXTRACTED BLUEPRINT DATA:
`;

  // Add room information
  if (structuredData.rooms.length > 0) {
    prompt += `\nROOMS IDENTIFIED (${structuredData.rooms.length}):
`;
    structuredData.rooms.forEach((room, index) => {
      prompt += `${index + 1}. ${room.name} (Type: ${room.type})`;
      if (room.dimensions) prompt += ` - Dimensions: ${room.dimensions}`;
      prompt += '\n';
    });
  }

  // Add measurements
  if (dimensions.length > 0) {
    prompt += `\nMEASUREMENTS FOUND:
${dimensions.slice(0, 10).join(', ')}
`;
  }

  // Add scale information
  if (scaleInfo.length > 0) {
    prompt += `\nSCALE INFORMATION:
${scaleInfo.join(', ')}
`;
  }

  // Add annotations
  if (annotations.length > 0) {
    prompt += `\nANNOTATIONS & SPECIFICATIONS:
${annotations.slice(0, 5).join('\n')}
`;
  }

  // Add structural elements
  if (structuredData.elements.length > 0) {
    prompt += `\nSTRUCTURAL ELEMENTS:
`;
    structuredData.elements.forEach(element => {
      prompt += `- ${element.type}: ${element.description}\n`;
    });
  }

  // Add the main instruction
  prompt += `

TASK: Create a comprehensive 3D architectural model specification based on this extracted blueprint data.

REQUIREMENTS:
1. Generate realistic wall layouts connecting the identified rooms
2. Place doors and windows logically between rooms and to exterior
3. Use extracted measurements for accurate proportions
4. Create proper room layouts based on identified room types
5. Include structural elements like beams and columns where appropriate
6. Ensure building code compliance for room sizes and layouts

OUTPUT FORMAT (JSON):
{
  "elements": [
    {
      "type": "wall|door|window|beam|column|room",
      "name": "descriptive name",
      "confidence": 0.85,
      "position": {"x": number, "y": number},
      "dimensions": {"width": number, "height": number},
      "properties": {"material": "concrete|wood|steel", "thickness": number}
    }
  ],
  "rooms": [
    {
      "name": "room name",
      "type": "living_room|bedroom|kitchen|bathroom|etc",
      "area": number_in_sqft,
      "bounds": {"x": number, "y": number, "width": number, "height": number},
      "connections": ["adjacent room names"]
    }
  ],
  "metadata": {
    "buildingType": "residential|commercial",
    "totalArea": number,
    "floorCount": 1,
    "estimatedDimensions": {"width": number, "height": number}
  }
}

Focus on creating a realistic, buildable structure that matches the extracted blueprint data.`;

  return prompt;
};

const parseTextBasedGeminiResults = (result: string, extractedData: ExtractedTextData): DetectedObject[] => {
  try {
    logger.info('🔍 Parsing text-based Gemini results', 'Text-Based AI');
    
    // Clean the result string
    let jsonStr = result.trim();
    
    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }
    
    // Try to extract JSON object from text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const analysisData = JSON.parse(jsonStr);
    const detectedObjects: DetectedObject[] = [];

    // Parse elements with better positioning
    const elements = analysisData.elements || [];
    elements.forEach((element: any, index: number) => {
      const obj: DetectedObject = {
        label: element.type || element.name || 'structural',
        confidence: Math.min(Math.max(element.confidence || 0.85, 0.7), 1.0),
        bbox: {
          x: Math.max(0, Math.min(element.position?.x || (index % 4) * 20 + 5, 90)),
          y: Math.max(0, Math.min(element.position?.y || Math.floor(index / 4) * 15 + 5, 90)),
          width: Math.max(2, Math.min(element.dimensions?.width || getDefaultWidth(element.type), 40)),
          height: Math.max(2, Math.min(element.dimensions?.height || getDefaultHeight(element.type), 30))
        }
      };
      detectedObjects.push(obj);
    });

    // Parse rooms with better spatial awareness
    const rooms = analysisData.rooms || [];
    rooms.forEach((room: any, index: number) => {
      const obj: DetectedObject = {
        label: room.type || room.name || 'room',
        confidence: Math.min(Math.max(room.confidence || 0.90, 0.80), 1.0),
        bbox: {
          x: Math.max(0, Math.min(room.bounds?.x || (index % 3) * 25 + 10, 80)),
          y: Math.max(0, Math.min(room.bounds?.y || Math.floor(index / 3) * 20 + 10, 80)),
          width: Math.max(10, Math.min(room.bounds?.width || getRoomDefaultWidth(room.type), 50)),
          height: Math.max(10, Math.min(room.bounds?.height || getRoomDefaultHeight(room.type), 40))
        }
      };
      detectedObjects.push(obj);
    });

    // Enhance with extracted text data if we have few objects
    if (detectedObjects.length < extractedData.structuredData.rooms.length) {
      logger.info('📈 Enhancing with extracted room data', 'Text-Based AI');
      
      extractedData.structuredData.rooms.forEach((room, index) => {
        if (!detectedObjects.find(obj => obj.label.toLowerCase().includes(room.type))) {
          detectedObjects.push({
            label: room.type.replace('_', ' '),
            confidence: 0.85,
            bbox: {
              x: 10 + (index % 3) * 25,
              y: 10 + Math.floor(index / 3) * 20,
              width: getRoomDefaultWidth(room.type),
              height: getRoomDefaultHeight(room.type)
            }
          });
        }
      });
    }

    logger.info(`✅ Successfully parsed ${detectedObjects.length} objects from text-based analysis`, 'Text-Based AI');
    
    if (detectedObjects.length === 0) {
      throw new Error('No architectural elements generated from text analysis');
    }

    return detectedObjects;

  } catch (parseError) {
    logger.error('❌ Failed to parse text-based Gemini result', 'Text-Based AI', {
      error: parseError instanceof Error ? parseError.message : 'Unknown error',
      resultPreview: result.substring(0, 200)
    });
    
    // Fallback: Create objects based on extracted text data
    return createFallbackFromTextData(extractedData);
  }
};

const getDefaultWidth = (elementType: string): number => {
  const defaults: Record<string, number> = {
    wall: 25,
    door: 8,
    window: 12,
    beam: 30,
    column: 4,
    room: 20
  };
  return defaults[elementType] || 15;
};

const getDefaultHeight = (elementType: string): number => {
  const defaults: Record<string, number> = {
    wall: 3,
    door: 15,
    window: 8,
    beam: 3,
    column: 4,
    room: 15
  };
  return defaults[elementType] || 10;
};

const getRoomDefaultWidth = (roomType: string): number => {
  const defaults: Record<string, number> = {
    living_room: 35,
    bedroom: 25,
    kitchen: 20,
    bathroom: 15,
    dining_room: 25,
    office: 20,
    closet: 8,
    hallway: 6,
    garage: 40,
    utility: 12
  };
  return defaults[roomType] || 20;
};

const getRoomDefaultHeight = (roomType: string): number => {
  const defaults: Record<string, number> = {
    living_room: 25,
    bedroom: 20,
    kitchen: 18,
    bathroom: 12,
    dining_room: 20,
    office: 18,
    closet: 6,
    hallway: 4,
    garage: 30,
    utility: 10
  };
  return defaults[roomType] || 15;
};

const createFallbackFromTextData = (extractedData: ExtractedTextData): DetectedObject[] => {
  logger.info('🔄 Creating fallback objects from text data', 'Text-Based AI');
  
  const objects: DetectedObject[] = [];
  
  // Create objects from room data
  extractedData.structuredData.rooms.forEach((room, index) => {
    objects.push({
      label: room.type.replace('_', ' '),
      confidence: 0.80,
      bbox: {
        x: 10 + (index % 3) * 25,
        y: 10 + Math.floor(index / 3) * 20,
        width: getRoomDefaultWidth(room.type),
        height: getRoomDefaultHeight(room.type)
      }
    });
  });
  
  // Add basic structural elements
  objects.push(
    {
      label: 'wall',
      confidence: 0.85,
      bbox: { x: 5, y: 5, width: 60, height: 2 }
    },
    {
      label: 'door',
      confidence: 0.80,
      bbox: { x: 20, y: 5, width: 8, height: 15 }
    }
  );
  
  return objects;
};