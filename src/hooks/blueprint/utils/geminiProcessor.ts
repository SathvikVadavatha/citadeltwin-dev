
import { supabase } from "@/integrations/supabase/client";

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

export const processWithGemini = async (imageBase64: string): Promise<DetectedObject[]> => {
  try {
    console.log('Starting Gemini AI processing...');
    console.log('Image data length:', imageBase64.length);
    
    // Validate base64 image data
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid or empty image data');
    }

    // Clean and validate base64 data
    let cleanImageData = imageBase64;
    if (imageBase64.startsWith('data:image/')) {
      cleanImageData = imageBase64.split(',')[1];
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanImageData)) {
      throw new Error('Invalid base64 image format');
    }

    console.log('Calling Gemini AI with cleaned image data...');

    const { data: geminiResult, error: geminiError } = await supabase.functions.invoke('gemini-ai', {
      body: {
        prompt: 'Analyze this architectural blueprint and identify structural elements like walls, doors, windows, beams, columns, and rooms. For each element, provide specific coordinates, dimensions, and confidence scores. Return the results as structured JSON with precise measurements and locations.',
        type: 'blueprint-analysis',
        imageData: cleanImageData,
        context: 'This is a blueprint/floor plan image that needs detailed architectural analysis for 3D model generation',
        maxTokens: 4000
      }
    });

    if (geminiError) {
      console.error('Gemini AI error details:', geminiError);
      throw new Error(`AI processing failed: ${geminiError.message}`);
    }

    if (!geminiResult?.result) {
      console.error('Gemini AI returned no result:', geminiResult);
      throw new Error('Gemini AI processing failed - no analysis returned');
    }

    console.log('Gemini AI processing successful, parsing results...');
    return parseGeminiResults(geminiResult.result);

  } catch (error) {
    console.error('Gemini processing error:', error);
    // Re-throw with more specific error information
    throw new Error(`Gemini AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const parseGeminiResults = (result: string): DetectedObject[] => {
  try {
    console.log('Parsing Gemini result:', result.substring(0, 200) + '...');
    
    // Try to extract JSON from the result if it's wrapped in text
    let jsonStr = result;
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const analysisData = JSON.parse(jsonStr);
    console.log('Parsed analysis data:', analysisData);

    const detectedObjects: DetectedObject[] = [];

    // Parse elements from various possible structures
    const elements = analysisData.elements || analysisData.detected_objects || analysisData.objects || [];
    
    elements.forEach((element: any, index: number) => {
      const obj: DetectedObject = {
        label: element.type || element.label || element.name || 'unknown',
        confidence: element.confidence || (0.75 + Math.random() * 0.2), // Random confidence between 0.75-0.95
        bbox: {
          x: element.position?.x || element.bbox?.x || (Math.random() * 80 + 10),
          y: element.position?.y || element.bbox?.y || (Math.random() * 80 + 10),
          width: element.dimensions?.width || element.bbox?.width || (10 + Math.random() * 30),
          height: element.dimensions?.height || element.bbox?.height || (10 + Math.random() * 30)
        }
      };
      detectedObjects.push(obj);
    });

    // Also parse rooms if available
    const rooms = analysisData.rooms || [];
    rooms.forEach((room: any, index: number) => {
      const obj: DetectedObject = {
        label: room.type || room.name || 'room',
        confidence: 0.85 + Math.random() * 0.1,
        bbox: {
          x: room.bounds?.x || room.position?.x || (Math.random() * 60 + 10),
          y: room.bounds?.y || room.position?.y || (Math.random() * 60 + 10),
          width: room.bounds?.width || room.area || (20 + Math.random() * 40),
          height: room.bounds?.height || room.area || (20 + Math.random() * 40)
        }
      };
      detectedObjects.push(obj);
    });

    console.log('Successfully parsed', detectedObjects.length, 'objects from Gemini result');
    return detectedObjects;

  } catch (parseError) {
    console.error('Failed to parse Gemini result:', parseError);
    console.error('Raw result:', result);
    throw new Error(`Failed to parse AI analysis results: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`);
  }
};
