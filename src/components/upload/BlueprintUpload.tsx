import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileImage, AlertCircle, CheckCircle, Loader2, Box } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Model3DViewer } from "@/components/3d/Model3DViewer";

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

interface Generated3DModel {
  id: string;
  model_name: string;
  model_description: string;
  model_file_path: string;
  file_size: number;
  generation_status: string;
  processing_time_ms?: number;
}

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects: DetectedObject[];
  imageUrl: string;
  processingTime?: number;
  generated3DModels?: Generated3DModel[];
}

export const BlueprintUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generating3D, setGenerating3D] = useState(false);
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

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blueprints')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

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

      // Simulate 2D object detection (using mock data for now)
      const mockDetectedObjects: DetectedObject[] = [
        { label: 'door', confidence: 0.92, bbox: { x: 25, y: 45, width: 8, height: 15 } },
        { label: 'window', confidence: 0.88, bbox: { x: 60, y: 30, width: 12, height: 10 } },
        { label: 'wall', confidence: 0.95, bbox: { x: 10, y: 20, width: 80, height: 5 } },
        { label: 'room', confidence: 0.87, bbox: { x: 15, y: 25, width: 70, height: 50 } }
      ];

      // Save mock detection results
      await supabase
        .from('detection_results')
        .insert({
          upload_id: uploadRecord.id,
          detected_objects: mockDetectedObjects as any,
          processing_time_ms: 2500,
          model_used: 'mock-detector',
          confidence_threshold: 0.5
        });

      setProcessing(false);
      setGenerating3D(true);

      // Generate 3D model
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('generate-3d-model', {
          body: {
            uploadId: uploadRecord.id,
            detectedObjects: mockDetectedObjects,
            imageUrl: urlData.publicUrl
          }
        });

      if (functionError) throw functionError;

      // Fetch 3D models
      const { data: modelsData, error: modelsError } = await supabase
        .from('generated_3d_models')
        .select('*')
        .eq('upload_id', uploadRecord.id);

      if (modelsError) throw modelsError;

      setUploadResult({
        id: uploadRecord.id,
        filename: file.name,
        detectedObjects: mockDetectedObjects,
        imageUrl: urlData.publicUrl,
        processingTime: 2500,
        generated3DModels: modelsData
      });

      setGenerating3D(false);

      toast({
        title: "Upload successful",
        description: `Detected ${mockDetectedObjects.length} objects and generated 3D model.`,
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
      setGenerating3D(false);
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
    disabled: uploading || processing || generating3D
  });

  const resetUpload = () => {
    setUploadResult(null);
  };

  const download3DModel = async (model: Generated3DModel) => {
    try {
      const { data, error } = await supabase.storage
        .from('3d-models')
        .download(model.model_file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = model.model_name + '.glb';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${model.model_name}.glb`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download the 3D model.",
        variant: "destructive",
      });
    }
  };

  if (uploadResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Blueprint Analysis Results</h2>
          <Button variant="outline" onClick={resetUpload}>
            Upload Another Blueprint
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 2D Image and Detection Results */}
          <div className="space-y-6">
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3D Models */}
          <div className="space-y-6">
            {uploadResult.generated3DModels && uploadResult.generated3DModels.length > 0 ? (
              uploadResult.generated3DModels.map((model, index) => {
                const modelUrl = supabase.storage.from('3d-models').getPublicUrl(model.model_file_path).data.publicUrl;
                
                return (
                  <div key={model.id}>
                    <Model3DViewer
                      modelUrl={modelUrl}
                      modelName={model.model_name}
                      onDownload={() => download3DModel(model)}
                    />
                    
                    {/* Model Info */}
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Box className="h-5 w-5 text-blue-500" />
                          3D Model Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge variant={model.generation_status === 'completed' ? 'default' : 'secondary'}>
                            {model.generation_status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">File Size:</span>
                          <span className="text-sm">{(model.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                        {model.processing_time_ms && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Generation Time:</span>
                            <span className="text-sm">{model.processing_time_ms}ms</span>
                          </div>
                        )}
                        {model.model_description && (
                          <div>
                            <span className="text-sm text-muted-foreground">Description:</span>
                            <p className="text-sm mt-1">{model.model_description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No 3D models generated yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Blueprint</h2>
        <p className="text-muted-foreground">
          Upload a 2D blueprint to extract architectural elements and generate 3D models using AI.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading || processing || generating3D ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            
            {uploading || processing || generating3D ? (
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
                    <p className="text-lg font-medium">Analyzing blueprint with AI...</p>
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
                  <p className="text-primary font-medium mt-2">
                    ✨ Now with AI-powered 3D model generation!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
