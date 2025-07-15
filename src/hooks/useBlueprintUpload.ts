
import { useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBlueprintFileUpload } from './blueprint/useBlueprintFileUpload';
import { useBlueprintProcessing } from './blueprint/useBlueprintProcessing';

import { useState } from 'react';

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects: any[];
  imageUrl: string;
  processingTime?: number;
  processingMethod?: 'ai' | 'fallback';
  errorMessage?: string;
}

export const useBlueprintUpload = () => {
  const { toast } = useToast();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  const { uploading, uploadProgress, uploadFile } = useBlueprintFileUpload();
  const { processing, processingMethod, errorMessage, processBlueprint } = useBlueprintProcessing();

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

      console.log('All processing complete, setting results...');

      // Step 3: Set final results
      const normalizedProcessingMethod = processingMethod === 'text-ai' || processingMethod === 'text-fallback' ? 'ai' : processingMethod;
      
      const finalResult: UploadResult = {
        id: uploadData.uploadRecord.id,
        filename: file.name,
        detectedObjects,
        imageUrl: uploadData.publicUrl,
        processingTime: 8000,
        processingMethod: normalizedProcessingMethod,
        errorMessage
      };

      setUploadResult(finalResult);

      const processingMethodText = processingMethod === 'ai' ? 'Gemini AI' : 'Enhanced Sample Data';
      toast({
        title: "Upload Complete",
        description: `Successfully processed ${file.name} using ${processingMethodText} with ${detectedObjects.length} elements detected.`,
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
    processing,
    uploadProgress,
    uploadResult,
    uploadFile: handleFileUpload,
    resetUpload
  };
};
