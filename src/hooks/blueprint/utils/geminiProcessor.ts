
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
    console.log('🤖 Starting enhanced Gemini AI processing...');
    
    // Enhanced validation of base64 image data
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('No image data provided');
    }

    if (imageBase64.length < 100) {
      throw new Error('Image data too short - possible conversion error');
    }

    // Clean base64 data - remove data URL prefix if present
    let cleanImageData = imageBase64;
    if (imageBase64.startsWith('data:image/')) {
      const parts = imageBase64.split(',');
      if (parts.length !== 2) {
        throw new Error('Invalid data URL format');
      }
      cleanImageData = parts[1];
      console.log('🧹 Removed data URL prefix, clean data length:', cleanImageData.length);
    }

    // Enhanced base64 validation
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanImageData)) {
      console.error('❌ Invalid base64 format detected');
      console.error('Sample of invalid data:', cleanImageData.substring(0, 50));
      throw new Error('Invalid base64 image format - contains invalid characters');
    }

    // Check for reasonable size limits
    const estimatedSize = (cleanImageData.length * 3) / 4;
    if (estimatedSize > 20 * 1024 * 1024) {
      throw new Error('Image too large for processing (estimated > 20MB)');
    }

    console.log('📤 Calling Gemini AI edge function with validated data...');
    console.log('✅ Image data validation passed:', {
      originalLength: imageBase64.length,
      cleanLength: cleanImageData.length,
      estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2)
    });

    const { data: geminiResult, error: geminiError } = await supabase.functions.invoke('gemini-ai', {
      body: {
        prompt: `Analyze this architectural blueprint image and identify all structural and architectural elements. 

For each element found, provide:
1. Element type (wall, door, window, room, beam, column, etc.)
2. Precise location coordinates (x, y position)
3. Dimensions (width, height)
4. Confidence score (0.0 to 1.0)

Return results as JSON in this exact format:
{
  "elements": [
    {
      "type": "wall",
      "confidence": 0.95,
      "position": {"x": 10, "y": 20},
      "dimensions": {"width": 100, "height": 5}
    }
  ],
  "rooms": [
    {
      "name": "Living Room",
      "type": "living_room",
      "area": 250,
      "bounds": {"x": 10, "y": 10, "width": 50, "height": 40}
    }
  ]
}

Focus on accuracy and provide specific measurements suitable for 3D model generation.`,
        type: 'blueprint-analysis',
        imageData: cleanImageData,
        context: 'Architectural blueprint analysis for 3D model generation',
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
