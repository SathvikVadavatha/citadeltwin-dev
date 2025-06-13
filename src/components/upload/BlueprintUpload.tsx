import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileImage, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

interface DetectedObject {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects: DetectedObject[];
  imageUrl: string;
  processingTime?: number;
}

export const BlueprintUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;

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

    try {
      setUploading(true);
      setUploadProgress(0);

      // Create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage (without onUploadProgress as it's not supported)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blueprints')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Simulate progress for better UX
      setUploadProgress(50);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('blueprints')
        .getPublicUrl(fileName);

      setUploadProgress(75);

      // Save upload record
      const { data: uploadRecord, error: dbError } = await supabase
        .from('blueprint_uploads')
        .insert({
          user_id: user.id,
          filename: fileName,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: uploadData.path,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);
      setUploading(false);
      setProcessing(true);

      // Call object detection function
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('detect-objects', {
          body: {
            uploadId: uploadRecord.id,
            imageUrl: urlData.publicUrl
          }
        });

      if (functionError) throw functionError;

      // Fetch detection results
      const { data: detectionData, error: detectionError } = await supabase
        .from('detection_results')
        .select('*')
        .eq('upload_id', uploadRecord.id)
        .single();

      if (detectionError) throw detectionError;

      // Properly type the detected objects from Json type
      const detectedObjects = Array.isArray(detectionData.detected_objects) 
        ? (detectionData.detected_objects as unknown) as DetectedObject[]
        : [];

      setUploadResult({
        id: uploadRecord.id,
        filename: file.name,
        detectedObjects,
        imageUrl: urlData.publicUrl,
        processingTime: detectionData.processing_time_ms
      });

      toast({
        title: "Upload successful",
        description: `Detected ${detectedObjects.length} objects in your blueprint.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
    }
  }, [user, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: uploading || processing
  });

  const resetUpload = () => {
    setUploadResult(null);
  };

  if (uploadResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Detection Results</h2>
          <Button variant="outline" onClick={resetUpload}>
            Upload Another Blueprint
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                {uploadResult.filename}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img 
                  src={uploadResult.imageUrl} 
                  alt="Uploaded blueprint"
                  className="w-full rounded-lg border"
                />
                {/* Object detection overlays would go here */}
              </div>
            </CardContent>
          </Card>

          {/* Detection Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Detected Objects ({uploadResult.detectedObjects.length})
              </CardTitle>
              {uploadResult.processingTime && (
                <p className="text-sm text-muted-foreground">
                  Processed in {uploadResult.processingTime}ms
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadResult.detectedObjects.map((obj, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{obj.label}</p>
                      <p className="text-sm text-muted-foreground">
                        Position: {obj.bbox.x.toFixed(1)}%, {obj.bbox.y.toFixed(1)}%
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {(obj.confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
                
                {uploadResult.detectedObjects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No objects detected in this blueprint.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Blueprint</h2>
        <p className="text-muted-foreground">
          Upload a 2D blueprint to extract architectural elements using AI object detection.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading || processing ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            
            {uploading || processing ? (
              <div className="space-y-4">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <div>
                  {uploading && (
                    <>
                      <p className="text-lg font-medium">Uploading...</p>
                      <Progress value={uploadProgress} className="mt-2" />
                    </>
                  )}
                  {processing && (
                    <p className="text-lg font-medium">Processing with AI...</p>
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
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
