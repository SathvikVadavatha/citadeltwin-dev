
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, Zap, Brain, Box, CheckCircle, AlertCircle } from "lucide-react";
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
    if (uploading) return uploadProgress * 0.2; // 0-20% for upload
    if (processing) return 20 + 40; // 20-60% for processing
    if (enhancedAnalyzing) return 60 + 20; // 60-80% for analysis
    if (generating3D) return 80 + 15; // 80-95% for 3D generation
    return 0;
  };

  const getCurrentStep = () => {
    if (uploading) return "Uploading file to secure storage...";
    if (processing) return "Processing blueprint with Gemini AI vision...";
    if (enhancedAnalyzing) return "Performing enhanced structural analysis...";
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

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'upload':
        if (uploading) return { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-blue-600' };
        if (processing || enhancedAnalyzing || generating3D) return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' };
        return { icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, color: 'text-gray-400' };
      
      case 'process':
        if (processing) return { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-purple-600' };
        if (enhancedAnalyzing || generating3D) return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' };
        if (uploading) return { icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, color: 'text-gray-400' };
        return { icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, color: 'text-gray-400' };
      
      case 'analyze':
        if (enhancedAnalyzing) return { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-yellow-600' };
        if (generating3D) return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' };
        if (uploading || processing) return { icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, color: 'text-gray-400' };
        return { icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, color: 'text-gray-400' };
      
      case 'generate':
        if (generating3D) return { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-green-600' };
        return { icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, color: 'text-gray-400' };
      
      default:
        return { icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, color: 'text-gray-400' };
    }
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
                <div className="flex justify-center space-x-6 text-sm">
                  <div className={`flex items-center space-x-2 ${getStepStatus('upload').color}`}>
                    {getStepStatus('upload').icon}
                    <span>Upload</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${getStepStatus('process').color}`}>
                    {getStepStatus('process').icon}
                    <span>AI Process</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${getStepStatus('analyze').color}`}>
                    {getStepStatus('analyze').icon}
                    <span>Analyze</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${getStepStatus('generate').color}`}>
                    {getStepStatus('generate').icon}
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
