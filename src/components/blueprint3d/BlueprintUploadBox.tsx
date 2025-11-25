import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BlueprintUploadBoxProps {
  onFileUpload: (file: File) => void;
}

export const BlueprintUploadBox: React.FC<BlueprintUploadBoxProps> = ({ onFileUpload }) => {
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB',
        variant: 'destructive',
      });
      return;
    }

    onFileUpload(file);
  }, [onFileUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
        'hover:border-primary/50 hover:bg-accent/5',
        isDragActive && 'border-primary bg-accent/10'
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-primary/10 rounded-full">
          {isDragActive ? (
            <FileImage className="h-12 w-12 text-primary" />
          ) : (
            <Upload className="h-12 w-12 text-primary" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-lg font-semibold">
            {isDragActive ? 'Drop your blueprint here' : 'Upload Blueprint'}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag and drop your JPG or PNG file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: 10 MB
          </p>
        </div>

        <button
          type="button"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Select File
        </button>
      </div>
    </div>
  );
};
