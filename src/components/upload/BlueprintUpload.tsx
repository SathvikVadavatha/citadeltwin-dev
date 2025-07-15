
import React from 'react';
import { UploadForm } from './UploadForm';
import { UploadResults } from './UploadResults';
import { useBlueprintUpload } from '@/hooks/useBlueprintUpload';

interface BlueprintUploadProps {
  onUploadComplete?: (uploadId: string) => void;
}

export const BlueprintUpload: React.FC<BlueprintUploadProps> = ({ onUploadComplete }) => {
  const {
    uploading,
    processing,
    uploadProgress,
    uploadResult,
    uploadFile,
    resetUpload
  } = useBlueprintUpload();

  // Call onUploadComplete when upload is finished
  React.useEffect(() => {
    if (uploadResult && onUploadComplete) {
      onUploadComplete(uploadResult.id);
    }
  }, [uploadResult, onUploadComplete]);

  if (uploadResult) {
    return (
      <UploadResults
        uploadResult={uploadResult}
        onReset={resetUpload}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Blueprint</h2>
        <p className="text-muted-foreground">
          Upload a 2D blueprint to extract architectural elements and generate 3D models using enhanced Gemini AI analysis.
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
