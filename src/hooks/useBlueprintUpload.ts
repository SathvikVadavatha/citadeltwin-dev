
import { useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBlueprintFileUpload } from './blueprint/useBlueprintFileUpload';
import { useBlueprintProcessing } from './blueprint/useBlueprintProcessing';
import { useGeminiBlueprint3D } from './blueprint/useGeminiBlueprint3D';

import { useState } from 'react';

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects: any[];
  imageUrl: string;
  processingTime?: number;
  processingMethod?: 'ai' | 'fallback';
  errorMessage?: string;
  model3DUrl?: string;
  model3DGenerated?: boolean;
  generating3D?: boolean;
}

export const useBlueprintUpload = () => {
  const { toast } = useToast();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  const { uploading, uploadProgress, uploadFile } = useBlueprintFileUpload();
  const { processing, processingMethod, errorMessage, processBlueprint } = useBlueprintProcessing();
  const { analyzing, generating3D, analyzeBlueprint, generate3DModel } = useGeminiBlueprint3D();

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      console.log('Starting upload workflow for:', file.name);
      
      // Step 1: Upload file
      const uploadData = await uploadFile(file);
      if (!uploadData) {
        throw new Error('File upload failed');
      }

      console.log('File uploaded, starting processing...');
      
      // Step 2: Process blueprint with Plan2Scene
      let detectedObjects;
      try {
        detectedObjects = await processBlueprint(uploadData.uploadRecord.id, uploadData.publicUrl);
        console.log('Processing complete, objects detected:', detectedObjects?.length || 0);
      } catch (processingError) {
        console.error('Processing failed:', processingError);
        throw new Error(`Blueprint processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`);
      }
      
      if (!detectedObjects) {
        throw new Error('No objects detected from blueprint');
      }

      console.log('Processing complete, starting 3D model generation...');

      // Step 3: Generate 3D model
      const normalizedProcessingMethod = processingMethod === 'text-ai' || processingMethod === 'text-fallback' ? 'ai' : processingMethod;
      
      // Set initial result with 3D generation in progress
      const initialResult: UploadResult = {
        id: uploadData.uploadRecord.id,
        filename: file.name,
        detectedObjects,
        imageUrl: uploadData.publicUrl,
        processingTime: 8000,
        processingMethod: normalizedProcessingMethod,
        errorMessage,
        generating3D: true,
        model3DGenerated: false
      };

      setUploadResult(initialResult);

      // Generate 3D model
      let model3DUrl = '';
      try {
        const blueprintAnalysis = await analyzeBlueprint(uploadData.publicUrl, uploadData.uploadRecord.id);
        if (blueprintAnalysis) {
          await generate3DModel(blueprintAnalysis, uploadData.uploadRecord.id);
          
          // Get the generated 3D model URL
          const { data: model3DData } = await supabase
            .from('generated_3d_models')
            .select('model_file_path')
            .eq('upload_id', uploadData.uploadRecord.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (model3DData?.model_file_path) {
            const { data: urlData } = await supabase.storage
              .from('3d-models')
              .createSignedUrl(model3DData.model_file_path, 60 * 60); // 1 hour expiry
            
            model3DUrl = urlData?.signedUrl || '';
          }
        }
      } catch (model3DError) {
        console.error('3D model generation failed:', model3DError);
        // Continue without 3D model - not critical for main workflow
      }

      // Step 4: Set final results
      const finalResult: UploadResult = {
        id: uploadData.uploadRecord.id,
        filename: file.name,
        detectedObjects,
        imageUrl: uploadData.publicUrl,
        processingTime: 8000,
        processingMethod: normalizedProcessingMethod,
        errorMessage,
        model3DUrl,
        model3DGenerated: !!model3DUrl,
        generating3D: false
      };

      setUploadResult(finalResult);

      const processingMethodText = processingMethod === 'ai' ? 'Gemini AI' : 'Enhanced Sample Data';
      const model3DText = model3DUrl ? ' with 3D model generated' : '';
      toast({
        title: "Upload Complete",
        description: `Successfully processed ${file.name} using ${processingMethodText} with ${detectedObjects.length} elements detected${model3DText}.`,
      });

    } catch (error) {
      console.error('Upload workflow error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred during processing.",
        variant: "destructive",
      });
    }
  }, [uploadFile, processBlueprint, toast, processingMethod, errorMessage]);

  const resetUpload = () => {
    setUploadResult(null);
  };

  return {
    uploading,
    processing: processing || analyzing || generating3D,
    uploadProgress,
    uploadResult,
    uploadFile: handleFileUpload,
    resetUpload
  };
};
