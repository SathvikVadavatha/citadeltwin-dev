
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, Zap, Brain, Box, CheckCircle } from "lucide-react";
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

  // Calculate overall progress based on current step
  const getOverallProgress = () => {
    if (uploading) return uploadProgress * 0.25; // 25% for upload
    if (processing) return 25 + 25; // 25-50% for processing
    if (enhancedAnalyzing) return 50 + 25; // 50-75% for analysis
    if (generating3D) return 75 + 20; // 75-95% for 3D generation
    return 0;
  };

  const getCurrentStep = () => {
    if (uploading) return "Uploading file to secure storage...";
    if (processing) return "Processing blueprint with AI vision...";
    if (enhancedAnalyzing) return "Enhanced Gemini AI analysis in progress...";
    if (generating3D) return "Generating 3D model from analysis...";
    return "";
  };

  const getCurrentIcon = () => {
    if (uploading) return <Upload className="h-8 w-8 mx-auto animate-pulse text-blue-500" />;
    if (processing) return <Brain className="h-8 w-8 mx-auto animate-pulse text-purple-500" />;
    if (enhancedAnalyzing) return <Zap className="h-8 w-8 mx-auto animate-pulse text-yellow-500" />;
    if (generating3D) return <Box className="h-8 w-8 mx-auto animate-pulse text-green-500" />;
    return <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />;
  };

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
                {getCurrentIcon()}
              </div>
              <div className="space-y-3">
                <p className="text-lg font-medium">{getCurrentStep()}</p>
                <Progress value={getOverallProgress()} className="mt-2" />
                <div className="flex justify-center space-x-4 text-sm">
                  <div className={`flex items-center space-x-2 ${uploading || uploadProgress === 100 ? 'text-green-600' : 'text-gray-400'}`}>
                    {uploadProgress === 100 ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                    <span>Upload</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${processing ? 'text-purple-600' : processing === false && enhancedAnalyzing ? 'text-green-600' : 'text-gray-400'}`}>
                    {processing === false && (enhancedAnalyzing || generating3D) ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                    <span>Process</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${enhancedAnalyzing ? 'text-yellow-600' : enhancedAnalyzing === false && generating3D ? 'text-green-600' : 'text-gray-400'}`}>
                    {enhancedAnalyzing === false && generating3D ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                    <span>Analyze</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${generating3D ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className="h-4 w-4 rounded-full border-2 border-current" />
                    <span>Generate 3D</span>
                  </div>
                </div>
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
