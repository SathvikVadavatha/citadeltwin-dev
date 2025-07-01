
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
  const { data: geminiResult, error: geminiError } = await supabase.functions.invoke('gemini-ai', {
    body: {
      prompt: 'Analyze this architectural blueprint and identify structural elements like walls, doors, windows, beams, and columns. Return the results as a structured JSON with element types, positions, and confidence scores.',
      type: 'blueprint-analysis',
      imageData: imageBase64,
      context: 'This is a blueprint/floor plan image that needs to be analyzed for architectural elements'
    }
  });

  if (geminiError) {
    console.error('Gemini AI error:', geminiError);
    throw new Error(`AI processing failed: ${geminiError.message}`);
  }

  if (!geminiResult?.result) {
    throw new Error('Gemini AI processing failed - no analysis returned');
  }

  return parseGeminiResults(geminiResult.result);
};

const parseGeminiResults = (result: string): DetectedObject[] => {
  try {
    const analysisData = JSON.parse(result);
    return analysisData.elements?.map((element: any, index: number) => ({
      label: element.type || 'unknown',
      confidence: element.confidence || 0.85 + (index * 0.02),
      bbox: {
        x: element.position?.x || Math.random() * 80 + 10,
        y: element.position?.y || Math.random() * 80 + 10,
        width: element.dimensions?.width || 20,
        height: element.dimensions?.height || 15
      }
    })) || [];
  } catch (parseError) {
    console.warn('Failed to parse Gemini result:', parseError);
    throw new Error('Failed to parse AI analysis results');
  }
};
