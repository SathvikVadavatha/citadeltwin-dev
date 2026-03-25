import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileImage, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useSimplifiedUpload } from '@/hooks/useSimplifiedUpload';
import { UploadResultsTabs } from './UploadResultsTabs';

interface SimplifiedUploadFormProps {
  onUploadComplete?: (result: any) => void;
}

export const SimplifiedUploadForm: React.FC<SimplifiedUploadFormProps> = ({ 
  onUploadComplete 
}) => {
  const { 
    uploading, 
    uploadProgress, 
    processing, 
    processingStep,
    error, 
    result,
    uploadFile, 
    reset 
  } = useSimplifiedUpload();

  React.useEffect(() => {
    if (result && onUploadComplete) {
      onUploadComplete(result);
    }
  }, [result, onUploadComplete]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF) or PDF');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    await uploadFile(file);
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: uploading || processing
  });

  const getStatusContent = () => {
    if (error) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={reset}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (result) {
      return (
        <Alert className="mb-4 border-green-500/20 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-600">
            Upload completed successfully! File: {result.filename}
          </AlertDescription>
        </Alert>
      );
    }

    if (uploading || processing) {
      const currentStep = uploading ? 'Uploading file...' : 
                         processingStep === 'analysis' ? 'Analyzing blueprint...' :
                         'Processing complete';

      return (
        <div className="space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{currentStep}</span>
            <Badge variant="outline" className="border-primary text-primary">
              {uploading ? 'Uploading' : 'Processing'}
            </Badge>
          </div>
          <Progress 
            value={uploading ? uploadProgress : processing ? 50 : 100} 
            className="w-full" 
          />
        </div>
      );
    }

    return null;
  };

  if (result) {
    return (
      <UploadResultsTabs 
        uploadResult={{
          id: result.id,
          filename: result.filename,
          detectedObjects: result.detectedObjects || [],
          imageUrl: result.imageUrl,
          processingMethod: 'ai',
          enhancedRoomData: result.enhancedRoomData
        }}
        onReset={reset}
      />
    );
  }

  return (
    <Card className="skeuo-panel">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-primary" />
          <span>Upload Blueprint</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusContent()}
        
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
            ${(uploading || processing) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            {uploading || processing ? (
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            ) : (
              <FileImage className="w-12 h-12 text-muted-foreground mx-auto" />
            )}
            
            <div>
              <p className="text-lg font-medium text-foreground mb-2">
                {isDragActive ? 'Drop your blueprint here' : 'Upload Blueprint'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag & drop or click to select • JPEG, PNG, GIF, PDF • Max 50MB
              </p>
              
              {!uploading && !processing && (
                <Button variant="outline" size="sm" disabled={uploading || processing}>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Supported formats: JPEG, PNG, GIF, PDF</p>
          <p>• Maximum file size: 50MB</p>
          <p>• Processing includes basic object detection</p>
        </div>
      </CardContent>
    </Card>
  );
};