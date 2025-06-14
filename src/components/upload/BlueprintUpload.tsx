
import React from 'react';
import { UploadForm } from './UploadForm';
import { UploadResults } from './UploadResults';
import { useBlueprintUpload } from '@/hooks/useBlueprintUpload';

export const BlueprintUpload = () => {
  const {
    uploading,
    processing,
    generating3D,
    uploadProgress,
    uploadResult,
    uploadFile,
    resetUpload,
    download3DModel
  } = useBlueprintUpload();

  if (uploadResult) {
    return (
      <UploadResults
        uploadResult={uploadResult}
        onReset={resetUpload}
        onDownload3DModel={download3DModel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Blueprint</h2>
        <p className="text-muted-foreground">
          Upload a 2D blueprint to extract architectural elements and generate 3D models using AI.
        </p>
      </div>

      <UploadForm
        uploading={uploading}
        processing={processing}
        generating3D={generating3D}
        uploadProgress={uploadProgress}
        onFileUpload={uploadFile}
      />
    </div>
  );
};
