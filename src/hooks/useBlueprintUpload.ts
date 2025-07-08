
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
  processingMethod?: 'opencv' | 'ai' | 'fallback';
  errorMessage?: string;
}

export const useBlueprintUpload = () => {
  const { toast } = useToast();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  const { uploading, uploadProgress, uploadFile } = useBlueprintFileUpload();
  const { 
    processing, 
    generating3D, 
    processingMethod, 
    errorMessage, 
    processBlueprint, 
    generate3DModel,
    isOpenCVReady,
    openCVState
  } = useBlueprintProcessing();
  const { enhancedAnalyzing, performEnhancedAnalysis } = useBlueprintAnalysis();

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      console.log('🚀 Starting enhanced upload workflow for:', file.name, {
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
        openCVReady: isOpenCVReady,
        openCVStatus: openCVState?.status
      });
      
      // Step 1: Upload file with enhanced error handling
      console.log('📤 Step 1: Uploading file to secure storage...');
      const uploadData = await uploadFile(file);
      if (!uploadData) {
        throw new Error('File upload to storage failed - please check your internet connection and try again');
      }

      console.log('✅ File uploaded successfully, starting processing...', {
        uploadId: uploadData.uploadRecord.id,
        publicUrl: uploadData.publicUrl.substring(0, 100) + '...'
      });
      
      // Step 2: Process blueprint with enhanced error handling
      console.log('🔍 Step 2: Starting computer vision processing...');
      let detectedObjects;
      try {
        detectedObjects = await processBlueprint(uploadData.uploadRecord.id, uploadData.publicUrl);
        console.log('✅ Processing complete, objects detected:', detectedObjects?.length || 0, {
          processingMethod: processingMethod || 'unknown'
        });
      } catch (processingError) {
        const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
        console.error('❌ Blueprint processing failed:', processingError);
        
        // Provide more specific error messages
        if (errorMessage.includes('OpenCV')) {
          throw new Error(`Computer vision processing failed: ${errorMessage}. Your blueprint will be processed using geometric analysis instead.`);
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          throw new Error(`Network error during processing: ${errorMessage}. Please check your internet connection and try again.`);
        } else {
          throw new Error(`Blueprint processing failed: ${errorMessage}`);
        }
      }
      
      if (!detectedObjects || detectedObjects.length === 0) {
        throw new Error('No architectural elements could be detected from the blueprint. Please ensure your image shows a clear floor plan with visible walls, rooms, or architectural elements.');
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
      // Use the actual processing method from the processing hook
      const finalProcessingMethod = (processingMethod === 'opencv' || processingMethod === 'fallback') ? processingMethod : 'opencv';
      
      const finalResult: UploadResult = {
        id: uploadData.uploadRecord.id,
        filename: file.name,
        detectedObjects,
        imageUrl: uploadData.publicUrl,
        processingTime: 8000,
        generated3DModels: generated3DModels || [],
        floorPlanData: analysisData?.floorPlanData,
        geminiAnalysis: analysisData?.geminiAnalysis,
        processingMethod: finalProcessingMethod,
        errorMessage
      };

      setUploadResult(finalResult);

      toast({
        title: "Upload Complete",
        description: `Successfully processed ${file.name} with ${detectedObjects.length} architectural elements detected.`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during processing.";
      console.error('💥 Upload workflow error:', error, {
        fileName: file.name,
        fileSize: file.size,
        processingMethod: processingMethod || 'unknown',
        openCVReady: isOpenCVReady,
        openCVStatus: openCVState?.status
      });
      
      // Determine if this is a recoverable error
      const isRecoverable = errorMessage.includes('Computer vision') || 
                           errorMessage.includes('OpenCV') ||
                           errorMessage.includes('network');
      
      toast({
        title: isRecoverable ? "Processing Issue" : "Processing Failed",
        description: errorMessage,
        variant: isRecoverable ? "default" : "destructive",
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
    download3DModel,
    // OpenCV state
    isOpenCVReady,
    openCVState
  };
};
