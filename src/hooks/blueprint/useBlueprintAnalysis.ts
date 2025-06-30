
import { useState, useCallback } from 'react';
import { useGeminiBlueprint3D } from './useGeminiBlueprint3D';
import { useToast } from '@/components/ui/use-toast';

interface AnalysisResult {
  floorPlanData?: {
    dimensions: {
      width: number;
      height: number;
    };
    rooms: Array<{
      name: string;
      type: string;
      area: number;
      bounds: { x: number; y: number; width: number; height: number };
    }>;
    elements: Array<{
      type: string;
      name: string;
      position: { x: number; y: number };
      dimensions: { width: number; height: number };
    }>;
  };
  geminiAnalysis?: any;
}

export const useBlueprintAnalysis = () => {
  const [enhancedAnalyzing, setEnhancedAnalyzing] = useState(false);
  const { processBlueprint } = useGeminiBlueprint3D();
  const { toast } = useToast();

  const performEnhancedAnalysis = useCallback(async (
    imageUrl: string,
    uploadId: string,
    detectedObjects: any[]
  ): Promise<AnalysisResult | null> => {
    setEnhancedAnalyzing(true);
    
    try {
      console.log('Starting enhanced analysis for:', { imageUrl, uploadId, detectedObjects });
      
      // Use Gemini AI to process the blueprint
      const geminiResult = await processBlueprint(imageUrl, uploadId);
      
      if (geminiResult?.analysis) {
        const result: AnalysisResult = {
          floorPlanData: geminiResult.analysis.floorPlanData,
          geminiAnalysis: geminiResult.analysis
        };
        
        console.log('Enhanced analysis completed:', result);
        
        toast({
          title: "Enhanced Analysis Complete",
          description: `Gemini AI analyzed ${geminiResult.analysis.elements?.length || 0} elements and ${geminiResult.analysis.rooms?.length || 0} rooms`,
        });
        
        return result;
      } else {
        console.warn('Gemini analysis failed, using fallback data');
        
        // Create fallback analysis data based on detected objects
        const fallbackResult: AnalysisResult = {
          floorPlanData: {
            dimensions: { width: 30, height: 25 },
            rooms: detectedObjects
              .filter(obj => ['room', 'kitchen', 'bedroom', 'bathroom'].includes(obj.label.toLowerCase()))
              .map((obj, index) => ({
                name: obj.label.charAt(0).toUpperCase() + obj.label.slice(1),
                type: obj.label.toLowerCase(),
                area: obj.bbox ? (obj.bbox.width * obj.bbox.height * 0.3) : 100, // Rough area calculation
                bounds: obj.bbox ? {
                  x: obj.bbox.x * 0.3, // Scale from percentage to feet
                  y: obj.bbox.y * 0.25,
                  width: obj.bbox.width * 0.3,
                  height: obj.bbox.height * 0.25
                } : { x: index * 10, y: index * 8, width: 10, height: 8 }
              })),
            elements: detectedObjects
              .filter(obj => ['door', 'window', 'fixture'].includes(obj.label.toLowerCase()))
              .map((obj, index) => ({
                type: obj.label.toLowerCase(),
                name: `${obj.label.charAt(0).toUpperCase() + obj.label.slice(1)} ${index + 1}`,
                position: obj.bbox ? {
                  x: obj.bbox.x * 0.3,
                  y: obj.bbox.y * 0.25
                } : { x: index * 5, y: index * 3 },
                dimensions: obj.bbox ? {
                  width: Math.max(obj.bbox.width * 0.3, 2),
                  height: Math.max(obj.bbox.height * 0.25, 2)
                } : { width: 3, height: 2 }
              }))
          },
          geminiAnalysis: 'Analysis completed using detected objects as fallback data'
        };
        
        toast({
          title: "Analysis Complete",
          description: `Processed ${detectedObjects.length} detected elements with fallback analysis`,
        });
        
        return fallbackResult;
      }
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Failed to perform enhanced analysis",
        variant: "destructive",
      });
      return null;
    } finally {
      setEnhancedAnalyzing(false);
    }
  }, [processBlueprint, toast]);

  return {
    enhancedAnalyzing,
    performEnhancedAnalysis
  };
};
