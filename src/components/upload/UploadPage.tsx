
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadForm } from './UploadForm';
import { UploadResults } from './UploadResults';
import { useBlueprintUpload } from '@/hooks/useBlueprintUpload';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface UploadPageProps {
  onNavigate: (view: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const {
    uploading,
    processing,
    enhancedAnalyzing,
    generating3D,
    uploadProgress,
    uploadResult,
    uploadFile,
    resetUpload,
    download3DModel,
    cancelProcessing,
    canCancel,
    retryOpenCV,
    isOpenCVReady,
    openCVState
  } = useBlueprintUpload();

  // Show results if we have them
  if (uploadResult) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blueprint Analysis Results</h1>
            <p className="text-muted-foreground mt-2">
              Analysis complete for {uploadResult.filename}
            </p>
          </div>
          <Button onClick={resetUpload} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Upload Another
          </Button>
        </div>

        {/* Results Component */}
        <UploadResults
          uploadResult={uploadResult}
          onReset={resetUpload}
          onDownload3DModel={download3DModel}
        />
      </div>
    );
  }

  // Show upload form if no results
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Upload Blueprint</h1>
        <p className="text-muted-foreground mt-2">
          Upload a 2D blueprint to extract architectural elements and generate 3D models using OpenCV computer vision analysis.
        </p>
      </div>

      {/* Upload Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UploadForm
          uploading={uploading}
          processing={processing}
          enhancedAnalyzing={enhancedAnalyzing}
          generating3D={generating3D}
          uploadProgress={uploadProgress}
          processingMethod={uploadResult?.processingMethod}
          errorMessage={uploadResult?.errorMessage}
          onFileUpload={uploadFile}
          onRetry={retryOpenCV}
          onCancel={cancelProcessing}
          canCancel={canCancel}
          isOpenCVReady={isOpenCVReady}
          openCVState={openCVState}
        />
        
        {/* Preview/Results Placeholder */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">Upload a blueprint to see analysis results</p>
              <p className="text-sm mt-2">
                Your blueprint will be processed with OpenCV computer vision to extract architectural elements,
                identify rooms, and generate 3D models.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
