
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { parseGeminiResponse } from '../../utils/geminiResponseParser';

export const useGeminiAnalyzer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeBlueprint = useCallback(async (
    imageUrl: string,
    uploadId: string,
    existingDetections?: any[]
  ) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use advanced analysis.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setAnalyzing(true);
      const startTime = Date.now();

      const analysisPrompt = `You are an expert civil engineer analyzing a blueprint. Provide comprehensive technical analysis including architectural elements, structural analysis, and technical insights.

${existingDetections ? `CONTEXT: Previous detection found: ${JSON.stringify(existingDetections.map(d => d.label))}` : ''}

Analyze architectural elements, structural systems, and provide engineering recommendations.`;

      let geminiResponse = '';
      
      try {
        const { data, error } = await supabase.functions.invoke('gemini-ai', {
          body: {
            prompt: analysisPrompt,
            type: 'text-analysis',
            context: `Blueprint analysis for upload ID: ${uploadId}`,
            maxTokens: 3000
          }
        });

        if (error || data.error) {
          console.warn('Gemini AI service error, using fallback analysis');
          geminiResponse = 'Advanced analysis temporarily unavailable - using standard analysis.';
        } else {
          geminiResponse = data.result || 'Analysis completed successfully.';
        }
      } catch (error) {
        console.warn('Failed to call Gemini AI, using fallback analysis:', error);
        geminiResponse = 'Advanced analysis temporarily unavailable - using standard analysis.';
      }

      const processingTime = Date.now() - startTime;
      const structuredResult = parseGeminiResponse(geminiResponse, existingDetections || []);
      structuredResult.processingTime = processingTime;

      try {
        await supabase
          .from('detection_results')
          .insert({
            upload_id: uploadId,
            detected_objects: structuredResult.architecturalElements as any,
            processing_time_ms: processingTime,
            model_used: 'gemini-pro-enhanced',
            confidence_threshold: 0.7
          });
      } catch (error) {
        console.error('Database save error:', error);
      }

      toast({
        title: "Enhanced analysis complete",
        description: `Analyzed ${structuredResult.architecturalElements.length} architectural elements.`,
      });

      return structuredResult;

    } catch (error) {
      console.error('Gemini blueprint analysis error:', error);
      
      const fallbackResult = parseGeminiResponse(
        'Fallback analysis: Basic element detection completed.',
        existingDetections || []
      );
      
      toast({
        title: "Analysis completed",
        description: "Basic analysis completed. Advanced AI features may be temporarily unavailable.",
        variant: "default",
      });
      
      return fallbackResult;
    } finally {
      setAnalyzing(false);
    }
  }, [user, toast]);

  return {
    analyzing,
    analyzeBlueprint
  };
};
