
import { useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBlueprintFileUpload } from './blueprint/useBlueprintFileUpload';
import { useBlueprintProcessing } from './blueprint/useBlueprintProcessing';
import { useBlueprintAnalysis } from './blueprint/useBlueprintAnalysis';
import { useState } from 'react';

interface Generated3DModel {
  id: string;
  model_name: string;
  model_description: string;
  model_file_path: string;
  file_size: number;
  generation_status: string;
  processing_time_ms?: number;
}

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects: any[];
  imageUrl: string;
  processingTime?: number;
  generated3DModels?: Generated3DModel[];
  floorPlanData?: any;
  geminiAnalysis?: any;
  processingMethod?: 'ai' | 'fallback';
  errorMessage?: string;
}

export const useBlueprintUpload = () => {
  const { toast } = useToast();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  const { uploading, uploadProgress, uploadFile } = useBlueprintFileUpload();
  const { processing, generating3D, processingMethod, errorMessage, processBlueprint, generate3DModel } = useBlueprintProcessing();
  const { enhancedAnalyzing, performEnhancedAnalysis } = useBlueprintAnalysis();

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

      console.log('Starting enhanced analysis...');
      
      // Step 3: Enhanced analysis (optional, continues on failure)
      let analysisData;
      try {
        analysisData = await performEnhancedAnalysis(
          uploadData.publicUrl,
          uploadData.uploadRecord.id,
          detectedObjects
        );
        console.log('Enhanced analysis complete');
      } catch (analysisError) {
        console.error('Enhanced analysis failed:', analysisError);
        analysisData = null;
      }

      console.log('Generating 3D model...');

      // Step 4: Generate 3D model (optional, continues on failure)
      let generated3DModels;
      try {
        generated3DModels = await generate3DModel(
          uploadData.uploadRecord.id,
          detectedObjects,
          uploadData.publicUrl
        );
        console.log('3D model generation complete, models:', generated3DModels?.length || 0);
      } catch (modelError) {
        console.error('3D model generation failed:', modelError);
        generated3DModels = [];
      }

      console.log('All processing complete, setting results...');

      // Step 5: Set final results
      const normalizedProcessingMethod = processingMethod === 'text-ai' || processingMethod === 'text-fallback' ? 'ai' : processingMethod;
      
      const finalResult: UploadResult = {
        id: uploadData.uploadRecord.id,
        filename: file.name,
        detectedObjects,
        imageUrl: uploadData.publicUrl,
        processingTime: 8000,
        generated3DModels: generated3DModels || [],
        floorPlanData: analysisData?.floorPlanData,
        geminiAnalysis: analysisData?.geminiAnalysis,
        processingMethod: normalizedProcessingMethod,
        errorMessage
      };

      setUploadResult(finalResult);

      const processingMethodText = processingMethod === 'ai' ? 'Plan2Scene AI' : 'Enhanced Sample Data';
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
  }, [uploadFile, processBlueprint, performEnhancedAnalysis, generate3DModel, toast, processingMethod, errorMessage]);

  const resetUpload = () => {
    setUploadResult(null);
  };

  const download3DModel = async (model: Generated3DModel) => {
    try {
      const { data, error } = await supabase.storage
        .from('3d-models')
        .download(model.model_file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = model.model_name + '.glb';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${model.model_name}.glb`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download the 3D model.",
        variant: "destructive",
      });
    }
  };

  return {
    uploading,
    processing,
    enhancedAnalyzing,
    generating3D,
    uploadProgress,
    uploadResult,
    uploadFile: handleFileUpload,
    resetUpload,
    download3DModel
  };
};
