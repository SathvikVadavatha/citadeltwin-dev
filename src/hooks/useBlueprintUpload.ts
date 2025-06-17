
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
}

export const useBlueprintUpload = () => {
  const { toast } = useToast();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  const { uploading, uploadProgress, uploadFile } = useBlueprintFileUpload();
  const { processing, generating3D, processBlueprint, generate3DModel } = useBlueprintProcessing();
  const { enhancedAnalyzing, performEnhancedAnalysis } = useBlueprintAnalysis();

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      // Upload file
      const uploadData = await uploadFile(file);
      if (!uploadData) return;

      // Process blueprint
      const detectedObjects = await processBlueprint(uploadData.uploadRecord.id);

      // Enhanced analysis
      const analysisData = await performEnhancedAnalysis(
        uploadData.publicUrl,
        uploadData.uploadRecord.id,
        detectedObjects
      );

      // Generate 3D model
      const generated3DModels = await generate3DModel(
        uploadData.uploadRecord.id,
        detectedObjects,
        uploadData.publicUrl
      );

      setUploadResult({
        id: uploadData.uploadRecord.id,
        filename: file.name,
        detectedObjects,
        imageUrl: uploadData.publicUrl,
        processingTime: 3500,
        generated3DModels,
        floorPlanData: analysisData?.floorPlanData,
        geminiAnalysis: analysisData?.geminiAnalysis
      });

      toast({
        title: "Enhanced AI analysis complete",
        description: `Analyzed floor plan with Gemini AI, detected ${detectedObjects.length} elements.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload.",
        variant: "destructive",
      });
    }
  }, [uploadFile, processBlueprint, performEnhancedAnalysis, generate3DModel, toast]);

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
