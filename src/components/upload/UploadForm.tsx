
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, Zap, Brain, Box, CheckCircle, AlertCircle, Cpu, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ProcessingStatusPanel } from "./ProcessingStatusPanel";

interface UploadFormProps {
  uploading: boolean;
  processing: boolean;
  uploadProgress: number;
  processingMethod?: 'ai' | 'fallback' | null;
  errorMessage?: string;
  onFileUpload: (file: File) => void;
  onRetry?: () => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({
  uploading,
  processing,
  uploadProgress,
  processingMethod,
  errorMessage,
  onFileUpload,
  onRetry
}) => {
  const { toast } = useToast();

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Enhanced file validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF) or PDF.",
        variant: "destructive",
      });
      return;
    }

    // Enhanced file size validation
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB for optimal processing.",
        variant: "destructive",
      });
      return;
    }

    // Minimum file size check
    if (file.size < 1000) {
      toast({
        title: "File too small",
        description: "Please upload a valid blueprint file (minimum 1KB).",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ File validation passed:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(1)} KB`
    });

    onFileUpload(file);
  }, [onFileUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: uploading || processing
  });

  const isProcessing = uploading || processing;

  // Enhanced progress calculation
  const getOverallProgress = () => {
    if (uploading) return Math.min(uploadProgress * 0.25, 25); // 0-25% for upload
    if (processing) return 25 + 70; // 25-95% for AI processing
    return 0;
  };

  // Enhanced step descriptions
  const getCurrentStep = () => {
    if (uploading) return "Uploading blueprint to secure cloud storage...";
    if (processing) return "🤖 Analyzing blueprint with OCR text extraction and object detection...";
    return "";
  };

  // Enhanced step details
  const getCurrentStepDetails = () => {
    if (uploading) return "Securing your blueprint data with enterprise-grade encryption";
    if (processing) return "Extracting text and detecting architectural elements (walls, doors, windows, rooms)";
    return "";
  };

  // Enhanced icons with animations
  const getCurrentIcon = () => {
    if (uploading) return <Upload className="h-8 w-8 mx-auto animate-pulse text-blue-500" />;
    if (processing) return (
      <div className="relative">
        <Search className="h-8 w-8 mx-auto text-purple-500" />
        <Cpu className="h-4 w-4 absolute -top-1 -right-1 animate-spin text-purple-400" />
      </div>
    );
    return <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />;
  };

  // Enhanced step status indicators
  const getStepStatus = (step: string) => {
    const baseStyle = "flex items-center space-x-2 transition-all duration-300";
    
    switch (step) {
      case 'upload':
        if (uploading) return { 
          icon: <Loader2 className="h-4 w-4 animate-spin" />, 
          color: 'text-blue-600 font-medium',
          style: baseStyle + ' scale-105'
        };
        if (processing) return { 
          icon: <CheckCircle className="h-4 w-4" />, 
          color: 'text-green-600',
          style: baseStyle
        };
        return { 
          icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, 
          color: 'text-gray-400',
          style: baseStyle
        };
      
      case 'process':
        if (processing) return { 
          icon: <Loader2 className="h-4 w-4 animate-spin" />, 
          color: 'text-purple-600 font-medium',
          style: baseStyle + ' scale-105'
        };
        if (uploading) return { 
          icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, 
          color: 'text-gray-400',
          style: baseStyle
        };
        return { 
          icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, 
          color: 'text-gray-400',
          style: baseStyle
        };
      
      default:
        return { 
          icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, 
          color: 'text-gray-400',
          style: baseStyle
        };
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 hover:border-primary/20 transition-colors">
        <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
            ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25'}
            ${isProcessing ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary/5 hover:scale-[1.01]'}
          `}
        >
          <input {...getInputProps()} />
          
          {isProcessing ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                {getCurrentIcon()}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold text-primary">{getCurrentStep()}</p>
                  <p className="text-sm text-muted-foreground mt-1">{getCurrentStepDetails()}</p>
                </div>
                <div className="space-y-3">
                  <Progress 
                    value={getOverallProgress()} 
                    className="mt-2 h-3"
                  />
                  <div className="text-sm text-muted-foreground">
                    {Math.round(getOverallProgress())}% complete
                  </div>
                </div>
                <div className="flex justify-center space-x-6 text-sm">
                  <div className={getStepStatus('upload').style}>
                    <div className={getStepStatus('upload').color}>
                      {getStepStatus('upload').icon}
                      <span>Upload</span>
                    </div>
                  </div>
                  <div className={getStepStatus('process').style}>
                    <div className={getStepStatus('process').color}>
                      {getStepStatus('process').icon}
                      <span>Process & Analyze</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-xl font-semibold">
                  {isDragActive ? 'Drop your blueprint here' : 'Upload Your Blueprint'}
                </p>
                <p className="text-muted-foreground mt-1">
                  Drag & drop or click to select
                </p>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>📁 Supported: JPEG, PNG, GIF, PDF</p>
                <p>📏 Size limit: 10MB maximum</p>
                <div className="flex items-center justify-center gap-2 text-primary font-semibold mt-4 p-3 bg-primary/5 rounded-lg">
                  <Brain className="h-5 w-5" />
                  <span>Enhanced with Gemini AI for architectural analysis!</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    
    {/* Processing Status Panel */}
    {(isProcessing || processingMethod) && (
      <ProcessingStatusPanel
        uploading={uploading}
        processing={processing}
        processingMethod={processingMethod}
        errorMessage={errorMessage}
        onRetry={onRetry}
      />
    )}
  </div>
  );
};
