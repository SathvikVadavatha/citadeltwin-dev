
import React from 'react';
import { UploadForm } from './UploadForm';
import { UploadResults } from './UploadResults';
import { useSimplifiedUpload } from '@/hooks/useSimplifiedUpload';

interface BlueprintUploadProps {
  onUploadComplete?: (uploadId: string) => void;
}

export const BlueprintUpload: React.FC<BlueprintUploadProps> = ({ onUploadComplete }) => {
  const {
    uploading,
    processing,
    uploadProgress,
    result: uploadResult,
    uploadFile,
    reset: resetUpload
  } = useSimplifiedUpload();

  // Call onUploadComplete when upload is finished
  React.useEffect(() => {
    if (uploadResult && onUploadComplete) {
      onUploadComplete(uploadResult.id);
    }
  }, [uploadResult, onUploadComplete]);

  if (uploadResult) {
    return (
      <UploadResults
        uploadResult={{
          id: uploadResult.id,
          filename: uploadResult.filename,
          detectedObjects: [],
          imageUrl: uploadResult.imageUrl,
          processingMethod: 'fallback'
        }}
        onReset={resetUpload}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Blueprint</h2>
        <p className="text-muted-foreground">
          Upload a 2D blueprint to analyze and view architectural elements in a detailed breakdown.
        </p>
      </div>

      <UploadForm
        uploading={uploading}
        processing={processing}
        uploadProgress={uploadProgress}
        onFileUpload={uploadFile}
      />
    </div>
  );
};
