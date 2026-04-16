
import React, { useState } from 'react';
import { UploadForm } from './UploadForm';
import { UploadResults } from './UploadResults';
import { useSimplifiedUpload } from '@/hooks/useSimplifiedUpload';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Box } from 'lucide-react';

interface BlueprintUploadProps {
  onUploadComplete?: (uploadId: string) => void;
}

export const BlueprintUpload: React.FC<BlueprintUploadProps> = ({ onUploadComplete }) => {
  const { toast } = useToast();
  const [generating3D, setGenerating3D] = useState(false);
  const [model3DUrl, setModel3DUrl] = useState<string | null>(null);
  const [aiDetections, setAiDetections] = useState<any[] | null>(null);
  const [aiScaleInfo, setAiScaleInfo] = useState<any>(null);
  const [aiBuildingInfo, setAiBuildingInfo] = useState<any>(null);
  const [aiWalls, setAiWalls] = useState<any[] | null>(null);

  const {
    uploading,
    processing,
    uploadProgress,
    result: uploadResult,
    uploadFile,
    reset: resetUpload
  } = useSimplifiedUpload();

  // Trigger 3D generation once a file is uploaded
  const handleFileUpload = async (file: File) => {
    // First do the standard upload/processing
    await uploadFile(file);
  };

  // When upload result is ready, auto-trigger 3D generation
  React.useEffect(() => {
    if (uploadResult?.id && !generating3D && !model3DUrl) {
      trigger3DGeneration(uploadResult.id, uploadResult.imageUrl);
    }
  }, [uploadResult?.id]);

  const trigger3DGeneration = async (uploadId: string, imageUrl: string) => {
    setGenerating3D(true);
    try {
      console.log('Auto-triggering 3D generation for upload:', uploadId);

      const { data: generationResult, error: generationError } = 
        await supabase.functions.invoke('generate-3d-model', {
          body: {
            uploadId,
            imageUrl,
            uniqueFileName: `${uploadId}/model_${Date.now()}.glb`,
            isAIGenerated: true
          }
        });
    } catch (err) {
      console.error('3D generation error:', err);
      toast({
        title: '3D Generation Failed',
        description: err instanceof Error ? err.message : 'Could not generate 3D model.',
        variant: 'destructive',
      });
      // Still call onUploadComplete so user can navigate
      if (onUploadComplete && uploadResult?.id) onUploadComplete(uploadResult.id);
    } finally {
      setGenerating3D(false);
    }
  };

  const handleReset = () => {
    resetUpload();
    setModel3DUrl(null);
    setGenerating3D(false);
    setAiDetections(null);
    setAiScaleInfo(null);
    setAiBuildingInfo(null);
    setAiWalls(null);
  };

  if (uploadResult) {
    return (
      <div className="space-y-4">
        <UploadResults
          uploadResult={{
            id: uploadResult.id,
            filename: uploadResult.filename,
            // Use AI detections (with OCR dimensions) when available, fallback to client-side
            detectedObjects: aiDetections || uploadResult.detectedObjects || [],
            imageUrl: uploadResult.imageUrl,
            processingMethod: aiDetections ? 'ai' : 'fallback',
            enhancedRoomData: uploadResult.enhancedRoomData,
            model3DUrl: model3DUrl || undefined,
            model3DGenerated: !!model3DUrl,
            scaleInfo: aiScaleInfo,
            buildingInfo: aiBuildingInfo,
            walls: aiWalls,
          }}
          onReset={handleReset}
        />

        {/* 3D generation status */}
        {generating3D && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Generating 3D Model…</p>
              <p className="text-xs text-muted-foreground">AI is analyzing your blueprint and building the 3D model</p>
            </div>
          </div>
        )}

        {model3DUrl && !generating3D && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-accent/20 bg-accent/5">
            <Box className="h-5 w-5 text-accent-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">3D Model Ready</p>
              <p className="text-xs text-muted-foreground">Switch to the "3D View" tab to explore your model</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Blueprint</h2>
        <p className="text-muted-foreground">
          Upload a 2D blueprint to analyze and automatically generate a 3D model.
        </p>
      </div>

      <UploadForm
        uploading={uploading}
        processing={processing}
        uploadProgress={uploadProgress}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};
