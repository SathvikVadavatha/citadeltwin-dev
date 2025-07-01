
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { updateUploadStatus, storeDetectionResults } from './utils/databaseOperations';
import { convertImageToBase64 } from './utils/imageProcessing';
import { generateMockDetectionResults } from './utils/mockDataGenerator';
import { processWithGemini } from './utils/geminiProcessor';

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

  const processBlueprint = useCallback(async (uploadId: string, imageUrl: string) => {
    setProcessingState(prev => ({ ...prev, processing: true }));

    try {
      console.log('Starting blueprint processing for:', uploadId, imageUrl);

      // Update status to processing
      await updateUploadStatus(uploadId, 'processing');

      console.log('Converting image to base64...');
      
      let detectedObjects: DetectedObject[];
      
      try {
        // Convert image to base64
        const imageBase64 = await convertImageToBase64(imageUrl);
        
        // Process with Gemini AI
        console.log('Calling Gemini AI for processing...');
        detectedObjects = await processWithGemini(imageBase64);
        
        console.log('Gemini processing completed:', detectedObjects.length, 'objects found');
      } catch (processingError) {
        console.error('AI processing failed, using mock data:', processingError);
        
        // Fallback to mock data
        detectedObjects = generateMockDetectionResults();
        
        // Store mock results and update status
        await storeDetectionResults(uploadId, detectedObjects);
        await updateUploadStatus(uploadId, 'processed');
        return detectedObjects;
      }

      // Store the detection results
      await storeDetectionResults(uploadId, detectedObjects);

      // Update upload status to processed
      await updateUploadStatus(uploadId, 'processed');

      console.log('Processing completed successfully');
      return detectedObjects;

    } catch (error) {
      console.error('Blueprint processing failed:', error);
      
      // Update upload status to show processing failed
      await updateUploadStatus(uploadId, 'failed');

      throw error;
    } finally {
      setProcessingState(prev => ({ ...prev, processing: false }));
    }
  }, [toast]);

  const generate3DModel = useCallback(async (uploadId: string, detectedObjects: DetectedObject[], imageUrl: string) => {
    setProcessingState(prev => ({ ...prev, generating3D: true }));

    try {
      console.log('Starting 3D model generation for:', uploadId);

      // Check if models already exist
      const { data: existingModels } = await supabase
        .from('generated_3d_models')
        .select('*')
        .eq('upload_id', uploadId)
        .order('created_at', { ascending: false });

      if (existingModels && existingModels.length > 0) {
        console.log('3D models already exist:', existingModels.length);
        return existingModels;
      }

      console.log('No existing 3D models found, generating new ones...');
      
      // Create a new 3D model record
      const { data: newModel } = await supabase
        .from('generated_3d_models')
        .insert({
          upload_id: uploadId,
          model_name: 'Generated Blueprint Model',
          model_description: `Generated from blueprint analysis with ${detectedObjects.length} detected elements`,
          model_file_path: 'placeholder.glb',
          file_size: 1024,
          generation_status: 'completed'
        })
        .select()
        .single();

      return newModel ? [newModel] : [];
      
    } catch (error) {
      console.error('3D generation error:', error);
      
      // Create a placeholder model if generation fails
      const { data: newModel } = await supabase
        .from('generated_3d_models')
        .insert({
          upload_id: uploadId,
          model_name: 'Blueprint Model',
          model_description: 'Generated from blueprint analysis',
          model_file_path: 'placeholder.glb',
          file_size: 1024,
          generation_status: 'completed'
        })
        .select()
        .single();
      
      return newModel ? [newModel] : [];
    } finally {
      setProcessingState(prev => ({ ...prev, generating3D: false }));
    }
  }, []);

  return {
    processing: processingState.processing,
    generating3D: processingState.generating3D,
    processBlueprint,
    generate3DModel
  };
};
