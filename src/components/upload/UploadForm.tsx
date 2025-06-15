
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UploadFormProps {
  uploading: boolean;
  processing: boolean;
  enhancedAnalyzing: boolean;
  generating3D: boolean;
  uploadProgress: number;
  onFileUpload: (file: File) => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({
  uploading,
  processing,
  enhancedAnalyzing,
  generating3D,
  uploadProgress,
  onFileUpload
}) => {
  const { toast } = useToast();

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF) or PDF.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    onFileUpload(file);
  }, [onFileUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: uploading || processing || enhancedAnalyzing || generating3D
  });

  const isProcessing = uploading || processing || enhancedAnalyzing || generating3D;

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${isProcessing ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary/5'}
          `}
        >
          <input {...getInputProps()} />
          
          {isProcessing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {enhancedAnalyzing ? (
                  <Zap className="h-8 w-8 mx-auto animate-pulse text-yellow-500" />
                ) : (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                )}
              </div>
              <div>
                {uploading && (
                  <>
                    <p className="text-lg font-medium">Uploading...</p>
                    <Progress value={uploadProgress} className="mt-2" />
                  </>
                )}
                {processing && !uploading && (
                  <p className="text-lg font-medium">Analyzing blueprint with AI...</p>
                )}
                {enhancedAnalyzing && (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-yellow-600">
                      Gemini AI Enhanced Analysis
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Extracting architectural elements and engineering insights...
                    </p>
                  </div>
                )}
                {generating3D && (
                  <p className="text-lg font-medium">Generating 3D model...</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your blueprint here' : 'Drag & drop a blueprint'}
                </p>
                <p className="text-muted-foreground">
                  or click to select a file
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Supported formats: JPEG, PNG, GIF, PDF</p>
                <p>Maximum file size: 10MB</p>
                <div className="flex items-center justify-center gap-2 text-primary font-medium mt-2">
                  <Zap className="h-4 w-4" />
                  <span>Enhanced with Gemini AI engineering analysis!</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
