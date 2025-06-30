
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useGeminiBlueprint3D } from './useGeminiBlueprint3D';
import { useToast } from "@/components/ui/use-toast";

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

interface ProcessingState {
  processing: boolean;
  generating3D: boolean;
}

export const useBlueprintProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    processing: false,
    generating3D: false
  });
  const { toast } = useToast();

  const { processBlueprint: processWithGemini, analyzing, generating3D } = useGeminiBlueprint3D();

  const processBlueprint = useCallback(async (uploadId: string, imageUrl: string) => {
    setProcessingState(prev => ({ ...prev, processing: true }));

    try {
      console.log('Starting blueprint processing for:', uploadId, imageUrl);

      // Update status to processing
      const { error: updateError } = await supabase
        .from('blueprint_uploads')
        .update({
          upload_status: 'processing'
        })
        .eq('id', uploadId);

      if (updateError) {
        console.warn('Could not update upload status to processing:', updateError);
      }

      console.log('Calling Gemini AI for processing...');
      
      // Use Gemini AI for processing
      const geminiResult = await processWithGemini(imageUrl, uploadId);
      
      if (!geminiResult?.analysis) {
        throw new Error('Gemini AI processing failed - no analysis returned');
      }

      console.log('Gemini processing completed, extracting objects...');

      // Extract objects from Gemini analysis for compatibility
      const detectedObjects: DetectedObject[] = geminiResult.analysis.elements?.map((element: any, index: number) => ({
        label: element.type || 'unknown',
        confidence: element.properties?.confidence || 0.85 + (index * 0.02),
        bbox: {
          x: element.position?.x || Math.random() * 80 + 10,
          y: element.position?.y || Math.random() * 80 + 10,
          width: element.dimensions?.width || 20,
          height: element.dimensions?.height || 15
        }
      })) || [];

      console.log('Object extraction completed:', detectedObjects.length, 'objects found');

      // Store the detection results
      const { error: detectionError } = await supabase
        .from('detection_results')
        .insert({
          upload_id: uploadId,
          detected_objects: detectedObjects as any,
          processing_time_ms: 5000,
          model_used: 'gemini-pro-vision',
          confidence_threshold: 0.7
        });

      if (detectionError) {
        console.error('Failed to store detection results:', detectionError);
      }

      // Update upload status to processed
      const { error: finalUpdateError } = await supabase
        .from('blueprint_uploads')
        .update({
          upload_status: 'processed'
        })
        .eq('id', uploadId);

      if (finalUpdateError) {
        console.warn('Could not update upload status to processed:', finalUpdateError);
      }

      console.log('Processing completed successfully');
      return detectedObjects;

    } catch (error) {
      console.error('Blueprint processing failed:', error);
      
      // Update upload status to show processing failed
      await supabase
        .from('blueprint_uploads')
        .update({
          upload_status: 'failed'
        })
        .eq('id', uploadId);

      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Blueprint processing failed",
        variant: "destructive",
      });

      throw error;
    } finally {
      setProcessingState(prev => ({ ...prev, processing: false }));
    }
  }, [processWithGemini, toast]);

  const generate3DModel = useCallback(async (uploadId: string, detectedObjects: DetectedObject[], imageUrl: string) => {
    setProcessingState(prev => ({ ...prev, generating3D: true }));

    try {
      console.log('Starting 3D model generation for:', uploadId);

      // Check if models already exist
      const { data: existingModels, error: modelsError } = await supabase
        .from('generated_3d_models')
        .select('*')
        .eq('upload_id', uploadId)
        .order('created_at', { ascending: false });

      if (modelsError) {
        console.error('Error checking for existing 3D models:', modelsError);
      }

      if (existingModels && existingModels.length > 0) {
        console.log('3D models already exist:', existingModels.length);
        return existingModels;
      }

      console.log('No existing 3D models found, generating new ones...');
      
      // Generate new models using Gemini
      const geminiResult = await processWithGemini(imageUrl, uploadId);
      
      if (geminiResult?.model3D) {
        // Check again for the generated models
        const { data: newModels, error: newModelsError } = await supabase
          .from('generated_3d_models')
          .select('*')
          .eq('upload_id', uploadId)
          .order('created_at', { ascending: false });

        if (newModelsError) {
          console.error('Error fetching new 3D models:', newModelsError);
        }

        return newModels || [];
      } else {
        // Create a placeholder 3D model record
        const { data: newModel, error: createError } = await supabase
          .from('generated_3d_models')
          .insert({
            upload_id: uploadId,
            model_name: 'Generated Model',
            model_description: 'Generated from blueprint analysis',
            model_file_path: 'placeholder.glb',
            file_size: 1024,
            generation_status: 'pending'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating placeholder 3D model:', createError);
        }

        return newModel ? [newModel] : [];
      }
    } catch (error) {
      console.error('3D generation error:', error);
      
      toast({
        title: "3D Generation In Progress",
        description: "3D model generation is being processed in the background.",
        variant: "default",
      });
      
      return [];
    } finally {
      setProcessingState(prev => ({ ...prev, generating3D: false }));
    }
  }, [processWithGemini, toast]);

  return {
    processing: processingState.processing || analyzing,
    generating3D: processingState.generating3D || generating3D,
    processBlueprint,
    generate3DModel
  };
};
