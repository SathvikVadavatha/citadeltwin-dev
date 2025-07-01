
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
    console.log('🤖 Starting Gemini AI processing...');
    
    // Validate base64 image data
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid or empty image data');
    }

    // Clean base64 data - remove data URL prefix if present
    let cleanImageData = imageBase64;
    if (imageBase64.startsWith('data:image/')) {
      cleanImageData = imageBase64.split(',')[1];
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanImageData)) {
      console.error('Invalid base64 format detected');
      throw new Error('Invalid base64 image format');
    }

    console.log('📤 Calling Gemini AI edge function...');
    console.log('Image data length:', cleanImageData.length);

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
      console.error('❌ Gemini AI error:', geminiError);
      throw new Error(`Gemini AI processing failed: ${geminiError.message || 'Unknown error'}`);
    }

    if (!geminiResult || !geminiResult.result) {
      console.error('❌ No result from Gemini AI:', geminiResult);
      throw new Error('Gemini AI returned no analysis results');
    }

    console.log('✅ Gemini AI processing successful, parsing results...');
    return parseGeminiResults(geminiResult.result);

  } catch (error) {
    console.error('💥 Gemini processing error:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('400')) {
        throw new Error('Image format not supported by AI - try a different image format (PNG, JPEG)');
      } else if (error.message.includes('413')) {
        throw new Error('Image too large - please use an image smaller than 10MB');
      } else if (error.message.includes('timeout')) {
        throw new Error('AI processing timed out - try a simpler image or try again');
      }
    }
    
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
