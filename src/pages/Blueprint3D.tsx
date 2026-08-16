import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BlueprintUpload } from '@/components/upload/BlueprintUpload';
import { Model3DViewer } from '@/components/3d/Model3DViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useBlueprintModelGeneration } from '@/hooks/useBlueprintModelGeneration';

// model-viewer JSX intrinsic is declared in src/components/dashboard/MainDashboard.tsx and UploadResultsTabs.tsx
const ModelViewer = 'model-viewer' as any;

/** Existing-blueprint path: reached via /blueprint-3d?uploadId=<id> from View Blueprints. */
const ExistingBlueprintModel: React.FC<{ uploadId: string; autoRegenerate: boolean }> = ({
  uploadId,
  autoRegenerate,
}) => {
  const { state, modelUrl, originalFilename, isLegacyExpiredModel, errorMessage, unavailableReason, startGeneration } =
    useBlueprintModelGeneration(uploadId);
  const autoRegenerateTriggeredRef = useRef(false);

  // Auto-run generation the first time we land here and find a processed
  // blueprint with no model yet — mirrors the auto-trigger UX on the upload flow.
  useEffect(() => {
    if (state === 'idle') {
      startGeneration();
      return;
    }

    // The card's "Regenerate 3D Model" button already expressed intent — don't
    // make the user click again once they land here. Only fires once per visit
    // (and only for the expired-preview case), so a direct visit to this URL
    // without ?intent=regenerate — or a genuine post-retry failure, which
    // clears isLegacyExpiredModel — still shows the expired/failed message
    // with a manual button instead of looping.
    if (
      autoRegenerate &&
      state === 'failed' &&
      isLegacyExpiredModel &&
      !autoRegenerateTriggeredRef.current
    ) {
      autoRegenerateTriggeredRef.current = true;
      startGeneration();
    }
  }, [state, isLegacyExpiredModel, autoRegenerate, startGeneration]);

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-3 p-8 justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading blueprint…</span>
      </div>
    );
  }

  if (state === 'unavailable') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-foreground">3D model not available</p>
          <p className="text-sm text-muted-foreground">{unavailableReason}</p>
        </CardContent>
      </Card>
    );
  }

  if (state === 'generating' || state === 'idle') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-medium text-foreground">Generating 3D Model…</p>
          <p className="text-sm text-muted-foreground max-w-md">
            The CV pipeline is analyzing {originalFilename ? `"${originalFilename}"` : 'your blueprint'} and building
            the 3D model. This can take a couple of minutes — you can navigate away and come back; progress is saved.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state === 'failed') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-foreground">
            {isLegacyExpiredModel ? '3D model preview expired' : '3D generation failed'}
          </p>
          <p className="text-sm text-muted-foreground max-w-md">{errorMessage}</p>
          <Button onClick={() => startGeneration()} variant="outline" className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLegacyExpiredModel ? 'Regenerate 3D Model' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // state === 'completed'
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-lg">🏗️ Generated 3D Model</h3>
        <Badge variant="outline">{originalFilename}</Badge>
      </div>
      {modelUrl && <Model3DViewer modelUrl={modelUrl} modelName={originalFilename || '3D Model'} largeViewport />}
    </div>
  );
};

export const Blueprint3D: React.FC = () => {
  const [searchParams] = useSearchParams();
  const uploadId = searchParams.get('uploadId');
  const autoRegenerate = searchParams.get('intent') === 'regenerate';

  const [currentGlbUrl, setCurrentGlbUrl] = useState<string | null>(null);

  // Inject the Google model-viewer web component script once on mount.
  // unpkg.com is already allowed in script-src CSP.
  useEffect(() => {
    if (uploadId) return; // only needed by the legacy upload-driven path below
    const existing = document.querySelector(
      'script[src*="model-viewer.min.js"]'
    );
    if (!existing) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src =
        'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, [uploadId]);

  if (uploadId) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <ExistingBlueprintModel uploadId={uploadId} autoRegenerate={autoRegenerate} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Upload + pipeline trigger */}
      <BlueprintUpload
        onModelGenerated={(glbUrl) => {
          // Revoke the previous blob URL to free memory
          if (currentGlbUrl && currentGlbUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentGlbUrl);
          }
          setCurrentGlbUrl(glbUrl);
        }}
      />

      {/* 3D Model viewer — shown as soon as the pipeline returns a GLB */}
      {currentGlbUrl ? (
        <div>
          <h3
            style={{
              marginBottom: '12px',
              fontWeight: 600,
              fontSize: '1.1rem',
            }}
          >
            🏗️ Generated 3D Model (Python CV Pipeline)
          </h3>
          <div
            style={{
              width: '100%',
              height: '600px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            <ModelViewer
              src={currentGlbUrl}
              camera-controls
              auto-rotate
              shadow-intensity="1"
              exposure="0.8"
              style={{ width: '100%', height: '100%' }}
            />

          </div>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            border: '2px dashed #e2e8f0',
            color: '#94a3b8',
            fontSize: '0.95rem',
          }}
        >
          Upload a blueprint to generate a 3D model
        </div>
      )}
    </div>
  );
};
