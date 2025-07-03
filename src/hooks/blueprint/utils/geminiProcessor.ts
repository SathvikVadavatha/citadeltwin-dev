
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
    console.log('🤖 Starting enhanced Gemini AI architectural processing...');
    
    // Enhanced validation of base64 image data
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('No image data provided for Gemini AI analysis');
    }

    if (imageBase64.length < 100) {
      throw new Error('Image data too short - possible conversion error in upload pipeline');
    }

    // Clean base64 data - remove data URL prefix if present
    let cleanImageData = imageBase64;
    if (imageBase64.startsWith('data:image/')) {
      const parts = imageBase64.split(',');
      if (parts.length !== 2) {
        throw new Error('Invalid data URL format - malformed image data prefix');
      }
      cleanImageData = parts[1];
      console.log('🧹 Cleaned image data - removed data URL prefix, clean length:', cleanImageData.length);
    }

    // Enhanced base64 validation with detailed error reporting
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanImageData)) {
      console.error('❌ Invalid base64 format detected in image data');
      console.error('Sample of problematic data:', cleanImageData.substring(0, 50));
      console.error('Expected base64 characters: A-Z, a-z, 0-9, +, /, =');
      throw new Error('Invalid base64 image format - contains non-base64 characters, check image upload process');
    }

    // Check for reasonable size limits (Gemini has specific limits)
    const estimatedSize = (cleanImageData.length * 3) / 4;
    console.log(`📊 Image size analysis: ${cleanImageData.length} base64 chars ≈ ${(estimatedSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (estimatedSize > 20 * 1024 * 1024) {
      throw new Error(`Image too large for Gemini AI processing: ${(estimatedSize / 1024 / 1024).toFixed(2)} MB (max 20 MB)`);
    }

    if (estimatedSize < 1000) {
      console.warn('⚠️ Very small image detected, may not contain meaningful architectural content');
    }

    console.log('📤 Calling enhanced Gemini AI edge function for architectural analysis...');
    console.log('✅ Image data validation passed:', {
      originalLength: imageBase64.length,
      cleanLength: cleanImageData.length,
      estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2),
      imageType: imageBase64.includes('data:image/') ? imageBase64.split(';')[0].split('/')[1] : 'unknown'
    });

    const { data: geminiResult, error: geminiError } = await supabase.functions.invoke('gemini-ai', {
      body: {
        prompt: `You are an expert architect and structural engineer analyzing a blueprint/floor plan image. Extract ALL architectural and structural elements with precise measurements and coordinates.

CRITICAL REQUIREMENTS:
1. Identify and measure ALL visible elements (walls, doors, windows, rooms, fixtures, structural elements)
2. Provide realistic measurements in feet/meters suitable for 3D architectural modeling
3. Use a consistent coordinate system with (0,0) at bottom-left of the drawing
4. Estimate realistic building proportions and scale

REQUIRED OUTPUT FORMAT (JSON):
{
  "elements": [
    {
      "type": "wall|door|window|beam|column|fixture|stairs",
      "confidence": 0.0-1.0,
      "position": {"x": number, "y": number, "z": 0},
      "dimensions": {"width": number, "height": number, "depth": number},
      "properties": {"material": "string", "thickness": number}
    }
  ],
  "rooms": [
    {
      "name": "Room Name",
      "type": "living_room|bedroom|kitchen|bathroom|office|etc",
      "area": number_in_sqft,
      "bounds": {"x": number, "y": number, "width": number, "height": number},
      "features": ["door", "window", "etc"]
    }
  ],
  "metadata": {
    "scale": "architectural scale if visible",
    "totalArea": number,
    "buildingType": "residential|commercial|industrial",
    "floorCount": number,
    "estimatedDimensions": {"width": number, "height": number}
  }
}

FOCUS ON:
- Accurate wall thickness and heights (typical 8-12ft ceilings)
- Proper door sizes (typically 3ft x 7ft)
- Realistic window dimensions
- Room proportions and layouts
- Structural elements and their proper sizing

Analyze the image thoroughly and provide comprehensive architectural data.`,
        type: 'blueprint-analysis',
        imageData: cleanImageData,
        context: 'Professional architectural blueprint analysis for accurate 3D building model generation',
        maxTokens: 4000
      }
    });

    console.log('📥 Gemini AI response received:', { 
      hasData: !!geminiResult, 
      hasError: !!geminiError 
    });

    if (geminiError) {
      console.error('❌ Gemini AI edge function error:', geminiError);
      
      // Enhanced error reporting
      let errorMessage = 'Gemini AI processing failed';
      if (geminiError.message) {
        if (geminiError.message.includes('400')) {
          errorMessage = 'Invalid image format for AI processing';
        } else if (geminiError.message.includes('401') || geminiError.message.includes('403')) {
          errorMessage = 'Gemini AI authentication failed - API key issue';
        } else if (geminiError.message.includes('429')) {
          errorMessage = 'Gemini AI rate limit exceeded - too many requests';
        } else if (geminiError.message.includes('500')) {
          errorMessage = 'Gemini AI service temporarily unavailable';
        } else {
          errorMessage = `Gemini AI error: ${geminiError.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    if (!geminiResult) {
      console.error('❌ No result from Gemini AI edge function');
      throw new Error('Gemini AI edge function returned no data');
    }

    if (!geminiResult.result) {
      console.error('❌ Empty result from Gemini AI:', geminiResult);
      throw new Error('Gemini AI returned empty analysis results');
    }

    console.log('✅ Gemini AI processing successful, parsing results...');
    return parseGeminiResults(geminiResult.result);

  } catch (error) {
    console.error('💥 Enhanced Gemini processing error:', error);
    
    // Enhanced error analysis and reporting
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('400') || errorMsg.includes('bad request')) {
        throw new Error('Image format not supported by Gemini AI - try PNG or JPEG under 10MB');
      } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
        throw new Error('Gemini AI authentication failed - API key not configured properly');
      } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
        throw new Error('Gemini AI access denied - check API key permissions');
      } else if (errorMsg.includes('413') || errorMsg.includes('too large')) {
        throw new Error('Image too large for AI processing - please use an image smaller than 10MB');
      } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        throw new Error('Gemini AI rate limit exceeded - please wait a few minutes and try again');
      } else if (errorMsg.includes('500') || errorMsg.includes('internal server')) {
        throw new Error('Gemini AI service temporarily unavailable - please try again in a few minutes');
      } else if (errorMsg.includes('timeout')) {
        throw new Error('AI processing timed out - try a simpler image or try again');
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        throw new Error('Network error connecting to Gemini AI - check your internet connection');
      } else if (errorMsg.includes('invalid base64')) {
        throw new Error('Image processing error - please try uploading the image again');
      }
    }
    
    // Fallback error message
    const finalError = `Gemini AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    console.error('🚨 Final error being thrown:', finalError);
    throw new Error(finalError);
  }
};

const parseGeminiResults = (result: string): DetectedObject[] => {
  try {
    console.log('🔍 Parsing Gemini result...');
    
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

    console.log('📋 Attempting to parse JSON:', jsonStr.substring(0, 200) + '...');

    const analysisData = JSON.parse(jsonStr);
    const detectedObjects: DetectedObject[] = [];

    // Parse elements
    const elements = analysisData.elements || analysisData.detected_objects || analysisData.objects || [];
    
    elements.forEach((element: any) => {
      const obj: DetectedObject = {
        label: element.type || element.label || element.name || 'structural',
        confidence: Math.min(Math.max(element.confidence || 0.8, 0.5), 1.0), // Ensure confidence is between 0.5-1.0
        bbox: {
          x: Math.max(0, Math.min(element.position?.x || element.bbox?.x || Math.random() * 80, 100)),
          y: Math.max(0, Math.min(element.position?.y || element.bbox?.y || Math.random() * 80, 100)),
          width: Math.max(1, Math.min(element.dimensions?.width || element.bbox?.width || 10, 50)),
          height: Math.max(1, Math.min(element.dimensions?.height || element.bbox?.height || 10, 50))
        }
      };
      detectedObjects.push(obj);
    });

    // Parse rooms
    const rooms = analysisData.rooms || [];
    rooms.forEach((room: any) => {
      const obj: DetectedObject = {
        label: room.type || room.name || 'room',
        confidence: Math.min(Math.max(room.confidence || 0.85, 0.7), 1.0),
        bbox: {
          x: Math.max(0, Math.min(room.bounds?.x || room.position?.x || Math.random() * 60, 100)),
          y: Math.max(0, Math.min(room.bounds?.y || room.position?.y || Math.random() * 60, 100)),
          width: Math.max(5, Math.min(room.bounds?.width || room.area || 30, 60)),
          height: Math.max(5, Math.min(room.bounds?.height || room.area || 30, 60))
        }
      };
      detectedObjects.push(obj);
    });

    console.log(`✅ Successfully parsed ${detectedObjects.length} objects from Gemini AI`);
    
    if (detectedObjects.length === 0) {
      throw new Error('No architectural elements detected in the image');
    }

    return detectedObjects;

  } catch (parseError) {
    console.error('❌ Failed to parse Gemini result:', parseError);
    console.error('Raw result:', result);
    throw new Error(`Failed to parse AI analysis: ${parseError instanceof Error ? parseError.message : 'Invalid response format'}`);
  }
};
