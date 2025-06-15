
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
    enhancedAnalyzing,
    generating3D,
    uploadProgress,
    uploadResult,
    uploadFile,
    resetUpload,
    download3DModel
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
        onDownload3DModel={download3DModel}
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
        enhancedAnalyzing={enhancedAnalyzing}
        generating3D={generating3D}
        uploadProgress={uploadProgress}
        onFileUpload={uploadFile}
      />
    </div>
  );
};
