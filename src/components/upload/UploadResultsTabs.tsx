import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Image, Layers, Box } from "lucide-react";
import { RealTime3DGenerator } from "@/components/3d/RealTime3DGenerator";

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
  enhancedRoomData?: any[];
}

interface UploadResultsTabsProps {
  uploadResult: UploadResult;
  onReset: () => void;
}

export const UploadResultsTabs: React.FC<UploadResultsTabsProps> = ({
  uploadResult,
  onReset
}) => {
  // Debug logging for 3D data
  useEffect(() => {
    console.log('3D Preview - enhancedRoomData:', uploadResult.enhancedRoomData);
    if (uploadResult.enhancedRoomData && Array.isArray(uploadResult.enhancedRoomData)) {
      console.log('Room data for 3D:', uploadResult.enhancedRoomData.length, 'rooms');
      uploadResult.enhancedRoomData.forEach((room, i) => {
        console.log(`Room ${i}:`, { 
          type: room.type, 
          points: room.points?.length,
          dimensions: room.realWorldDimensions 
        });
      });
    }
  }, [uploadResult.enhancedRoomData]);
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
          <TabsTrigger value="3d-preview">3D Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rooms Detected</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{objectCount}</div>
                <p className="text-xs text-muted-foreground">
                  Rooms identified and analyzed
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

          {/* Room Summary */}
          {uploadResult.detectedObjects && uploadResult.detectedObjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Room Summary</CardTitle>
                <CardDescription>
                  Overview of detected room types and total area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadResult.detectedObjects.filter(obj => obj.label === 'bedroom').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResult.detectedObjects.filter(obj => obj.label === 'bathroom' || obj.label === 'toilet').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {uploadResult.detectedObjects.filter(obj => obj.label === 'kitchen').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Kitchens</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {uploadResult.detectedObjects.reduce((sum, obj) => sum + (obj.area || 0), 0).toFixed(0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total sq ft</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              <CardTitle>Room Analysis</CardTitle>
              <CardDescription>
                Detailed analysis of rooms with dimensions and specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objectCount > 0 ? (
                <div className="space-y-4">
                  {uploadResult.detectedObjects?.map((room, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">
                            {room.label || 'Unknown'}
                          </Badge>
                          <h3 className="font-medium text-lg">
                            {room.name || `${room.label || 'Room'} ${index + 1}`}
                          </h3>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round((room.confidence || 0) * 100)}% confidence
                        </span>
                      </div>
                      
                      {room.dimensions && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-md">
                          <div>
                            <p className="text-sm text-muted-foreground">Dimensions</p>
                            <p className="font-medium">
                              {room.dimensions.width}' × {room.dimensions.length}'
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Area</p>
                            <p className="font-medium">
                              {room.dimensions.area} sq {room.dimensions.units}
                            </p>
                          </div>
                          <div className="hidden md:block">
                            <p className="text-sm text-muted-foreground">Position</p>
                            <p className="font-medium text-xs">
                              ({Math.round(room.bbox?.x || 0)}, {Math.round(room.bbox?.y || 0)})
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {!room.dimensions && room.bbox && (
                        <div className="text-xs text-muted-foreground">
                          Position: ({Math.round(room.bbox.x)}, {Math.round(room.bbox.y)}) - 
                          Size: {Math.round(room.bbox.width)}×{Math.round(room.bbox.height)} px
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No rooms detected in this blueprint</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3d-preview" className="space-y-4">
          {uploadResult.enhancedRoomData && Array.isArray(uploadResult.enhancedRoomData) && uploadResult.enhancedRoomData.length > 0 ? (
            <RealTime3DGenerator
              rooms={uploadResult.enhancedRoomData}
              title="Real-Time 3D Preview"
              uploadId={uploadResult.id}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>3D Preview</CardTitle>
                <CardDescription>
                  Real-time 3D visualization from room analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No room data available for 3D preview</p>
                  <p className="text-sm mt-2">Upload a blueprint with detectable rooms to see 3D visualization</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};