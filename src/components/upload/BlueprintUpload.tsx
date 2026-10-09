
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UploadForm } from './UploadForm';
import { UploadResults } from './UploadResults';
import { useSimplifiedUpload } from '@/hooks/useSimplifiedUpload';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Box } from 'lucide-react';

interface BlueprintUploadProps {
  onUploadComplete?: (uploadId: string) => void;
  /** Called immediately after the pipeline returns a GLB, before the DB insert. */
  onModelGenerated?: (glbUrl: string, uploadId: string) => void;
}

export const BlueprintUpload: React.FC<BlueprintUploadProps> = ({
  onUploadComplete,
  onModelGenerated,
}) => {
  const { toast } = useToast();
  const [generating3D, setGenerating3D] = useState(false);
  const [model3DUrl, setModel3DUrl] = useState<string | null>(null);
  const [aiDetections, setAiDetections] = useState<any[] | null>(null);
  const [aiScaleInfo, setAiScaleInfo] = useState<any>(null);
  const [aiBuildingInfo, setAiBuildingInfo] = useState<any>(null);
  const [aiWalls, setAiWalls] = useState<any[] | null>(null);
  const [aiDimensions, setAiDimensions] = useState<any[] | null>(null);
  const [aiWindows, setAiWindows] = useState<any[] | null>(null);

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
      console.log('Calling pipeline for upload:', uploadId, 'imageUrl:', imageUrl);

      // Defaults to the deployed HF Space so nothing changes for anyone who
      // doesn't opt in. Set VITE_PIPELINE_URL=http://localhost:8000 (or
      // wherever `blueprint-pipeline`'s uvicorn server is running) in a
      // local .env file to point this at a local backend during development.
      const PIPELINE_URL = import.meta.env.VITE_PIPELINE_URL || 'https://sathvikvadavatha-citadeltwin-pipeline.hf.space';

      const pipelineRes = await fetch(`${PIPELINE_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl })
      });

      console.log('Pipeline response status:', pipelineRes.status);

      if (!pipelineRes.ok) {
        throw new Error(`Pipeline error: ${pipelineRes.statusText}`);
      }

      const pipelineData = await pipelineRes.json();
      console.log('Pipeline response data:', pipelineData);

      const { glb_base64, rooms, walls, windows, dimensions, metadata } = pipelineData;

      const glbBytes = Uint8Array.from(atob(glb_base64), c => c.charCodeAt(0));
      const glbBlob = new Blob([glbBytes], { type: 'model/gltf-binary' });
      const glbUrl = URL.createObjectURL(glbBlob);

      // Update local state so the upload results card shows the model
      setModel3DUrl(glbUrl);
      if (rooms) setAiDetections(rooms);
      // `walls`, `windows`, and `dimensions` are top-level fields on the
      // pipeline response (see blueprint-pipeline/main.py ProcessResponse),
      // not nested under `metadata` — metadata only carries building-level
      // summary stats (width/height/room count/warnings).
      if (walls) setAiWalls(walls);
      if (windows) setAiWindows(windows);
      if (dimensions) setAiDimensions(dimensions);
      if (metadata?.scale) setAiScaleInfo(metadata.scale);
      if (metadata?.building) setAiBuildingInfo(metadata.building);

      // Immediately notify parent so it can pass the URL directly to Model3DViewer
      // (avoids stale blob URL issues from DB polling)
      if (onModelGenerated) {
        onModelGenerated(glbUrl, uploadId);
      }

      const modelData = {
        model_name: `Blueprint Model ${uploadId}`,
        model_description: `AI-generated 3D model from blueprint upload`,
        model_file_path: glbUrl,
        file_size: glbBytes.length,
        generation_status: 'completed',
        generation_prompt: 'Python CV pipeline',
        upload_id: uploadId
      };

      console.log('About to insert into DB for upload:', uploadId);

      // Insert into generated_3d_models (background persistence)
      const { error: insertError } = await supabase.from('generated_3d_models').insert(modelData);
      console.log('DB insert result:', insertError);

      if (onUploadComplete) onUploadComplete(uploadId);
    } catch (error) {
      console.error('trigger3DGeneration failed:', error);
      toast({
        title: '3D Generation Failed',
        description: error instanceof Error ? error.message : 'Could not generate 3D model.',
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
    setAiDimensions(null);
    setAiWindows(null);
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
            dimensions: aiDimensions,
            windows: aiWindows,
          }}
          onReset={handleReset}
        />

        {/* 3D generation status — shown while pipeline is running */}
        {generating3D && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Generating 3D Model…</p>
              <p className="text-xs text-muted-foreground">CV pipeline is analyzing your blueprint and building the 3D model</p>
            </div>
          </div>
        )}

        {/* "3D Model Ready" banner — only shown after pipeline completes */}
        {model3DUrl && !generating3D && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-accent/20 bg-accent/5">
            <Box className="h-5 w-5 text-accent-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">3D Model Ready — Switch to 3D View tab</p>
              <p className="text-xs text-muted-foreground">Your model was generated by the Python CV pipeline and is ready to explore</p>
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
