import React, { useState, useEffect } from 'react';
import { BlueprintUpload } from '@/components/upload/BlueprintUpload';

// model-viewer JSX intrinsic is declared in src/components/dashboard/MainDashboard.tsx and UploadResultsTabs.tsx
const ModelViewer = 'model-viewer' as any;

export const Blueprint3D: React.FC = () => {
  const [currentGlbUrl, setCurrentGlbUrl] = useState<string | null>(null);

  // Inject the Google model-viewer web component script once on mount.
  // unpkg.com is already allowed in script-src CSP.
  useEffect(() => {
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
  }, []);

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
            <model-viewer
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
