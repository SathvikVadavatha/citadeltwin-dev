
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

      // Fetch the image and re-send to the 3D generation edge function
      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      const file = new File([blob], 'blueprint.png', { type: blob.type || 'image/png' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_id', uploadId); // Link to existing blueprint_uploads row

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-blueprint-3d`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate 3D model');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setModel3DUrl(data.glb_url);
        // Store the AI detections with precise OCR dimensions
        if (data.detections?.length > 0) {
          setAiDetections(data.detections);
        }
        if (data.scale_info) setAiScaleInfo(data.scale_info);
        if (data.building_info) setAiBuildingInfo(data.building_info);
        if (data.walls) setAiWalls(data.walls);
        toast({
          title: '3D Model Ready',
          description: `Generated ${data.detections?.length || 0} rooms with precise dimensions.`,
        });
        if (onUploadComplete) onUploadComplete(uploadId);
      }
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
