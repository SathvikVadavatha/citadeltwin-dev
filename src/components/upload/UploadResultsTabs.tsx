import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Image, Layers, Box } from "lucide-react";

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects?: any[];
  imageUrl: string;
  processingTime?: number;
  processingMethod?: 'ai' | 'fallback';
  errorMessage?: string;
  model3DUrl?: string;
  model3DGenerated?: boolean;
  generating3D?: boolean;
}

interface UploadResultsTabsProps {
  uploadResult: UploadResult;
  onReset: () => void;
}

export const UploadResultsTabs: React.FC<UploadResultsTabsProps> = ({
  uploadResult,
  onReset
}) => {
  const handleDownload = () => {
    if (uploadResult.imageUrl) {
      const link = document.createElement('a');
      link.href = uploadResult.imageUrl;
      link.download = uploadResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const objectCount = uploadResult.detectedObjects?.length || 0;
  const processingMethod = uploadResult.processingMethod === 'ai' ? 'Gemini AI' : 'Enhanced Analysis';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analysis Complete</h2>
          <p className="text-muted-foreground">
            {uploadResult.filename} • Processed with {processingMethod}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Upload Another
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="3d-model">3D Model</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Elements Detected</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{objectCount}</div>
                <p className="text-xs text-muted-foreground">
                  Architectural elements identified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing Method</CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{processingMethod}</div>
                <p className="text-xs text-muted-foreground">
                  Analysis engine used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">3D Model</CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {uploadResult.model3DGenerated ? '✓' : uploadResult.generating3D ? '...' : '✗'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {uploadResult.model3DGenerated ? 'Generated' : 
                   uploadResult.generating3D ? 'Generating' : 'Not available'}
                </p>
              </CardContent>
            </Card>
          </div>

          {uploadResult.errorMessage && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Processing Warning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {uploadResult.errorMessage}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Original Blueprint</CardTitle>
              <CardDescription>
                The uploaded blueprint image used for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img
                  src={uploadResult.imageUrl}
                  alt={uploadResult.filename}
                  className="max-w-full max-h-96 object-contain border rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detected Elements</CardTitle>
              <CardDescription>
                Architectural elements identified in the blueprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objectCount > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {uploadResult.detectedObjects?.map((obj, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {obj.label || 'Unknown'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Confidence: {Math.round((obj.confidence || 0) * 100)}%
                          </span>
                        </div>
                        {obj.bbox && (
                          <div className="text-xs text-muted-foreground">
                            Position: ({Math.round(obj.bbox.x)}, {Math.round(obj.bbox.y)})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No elements detected in this blueprint</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3d-model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3D Model</CardTitle>
              <CardDescription>
                Generated 3D representation of the blueprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadResult.model3DGenerated && uploadResult.model3DUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">3D Model Viewer</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button asChild>
                      <a href={uploadResult.model3DUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download 3D Model
                      </a>
                    </Button>
                  </div>
                </div>
              ) : uploadResult.generating3D ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p className="text-muted-foreground">Generating 3D model...</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>3D model not available for this blueprint</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};