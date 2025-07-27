import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useRoomBoundaryDetection } from '@/hooks/useRoomBoundaryDetection';
import { RoomDetectionOptions } from '@/utils/roomBoundaryDetection';
import { Upload, Download, Trash2, Eye, Settings } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function RoomBoundaryDetector() {
  const {
    isLoading,
    result,
    canvasRef,
    detectRoomsFromFile,
    exportAsJSON,
    downloadJSON,
    clearResults,
  } = useRoomBoundaryDetection();

  const [options, setOptions] = useState<RoomDetectionOptions>({
    targetSize: 512,
    thresholdValue: 127,
    minRoomArea: 1000,
    morphKernelSize: 3,
    polygonApproxFactor: 0.02,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        detectRoomsFromFile(acceptedFiles[0], options);
      }
    },
    [detectRoomsFromFile, options]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    },
    multiple: false,
  });

  const handleOptionChange = (key: keyof RoomDetectionOptions, value: number) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Room Boundary Detection
          </CardTitle>
          <CardDescription>
            CPU-only pipeline to detect room boundaries from 2D floor plan images and export coordinates as JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p>Drop the floor plan image here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium">Upload Floor Plan Image</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop or click to select (PNG, JPG, GIF, BMP)
                </p>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Options
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetSize">Target Size (px)</Label>
                  <Input
                    id="targetSize"
                    type="number"
                    value={options.targetSize}
                    onChange={(e) => handleOptionChange('targetSize', parseInt(e.target.value))}
                    min="256"
                    max="1024"
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="thresholdValue">Threshold Value</Label>
                  <Input
                    id="thresholdValue"
                    type="number"
                    value={options.thresholdValue}
                    onChange={(e) => handleOptionChange('thresholdValue', parseInt(e.target.value))}
                    min="0"
                    max="255"
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="minRoomArea">Min Room Area</Label>
                  <Input
                    id="minRoomArea"
                    type="number"
                    value={options.minRoomArea}
                    onChange={(e) => handleOptionChange('minRoomArea', parseInt(e.target.value))}
                    min="100"
                    max="10000"
                    step="100"
                  />
                </div>
                <div>
                  <Label htmlFor="morphKernelSize">Morph Kernel Size</Label>
                  <Input
                    id="morphKernelSize"
                    type="number"
                    value={options.morphKernelSize}
                    onChange={(e) => handleOptionChange('morphKernelSize', parseInt(e.target.value))}
                    min="1"
                    max="10"
                    step="1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="polygonApproxFactor">Polygon Approximation Factor</Label>
                  <Input
                    id="polygonApproxFactor"
                    type="number"
                    value={options.polygonApproxFactor}
                    onChange={(e) => handleOptionChange('polygonApproxFactor', parseFloat(e.target.value))}
                    min="0.01"
                    max="0.1"
                    step="0.01"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={downloadJSON}
              disabled={!result || isLoading}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
            <Button
              onClick={clearResults}
              disabled={!result || isLoading}
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Results
            </Button>
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Processing floor plan...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Detected Room Boundaries</CardTitle>
              <CardDescription>
                Visual representation of detected rooms with correct axis orientation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                className="w-full border rounded-lg bg-white"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </CardContent>
          </Card>

          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                Summary of detected rooms and processing metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Rooms</Label>
                  <Badge variant="secondary" className="mt-1">
                    {result.totalRooms}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Processing Time</Label>
                  <Badge variant="secondary" className="mt-1">
                    {result.processingTime}ms
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Image Size</Label>
                  <Badge variant="secondary" className="mt-1">
                    {result.imageSize.width}×{result.imageSize.height}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">Room Details</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.rooms.map((room) => (
                    <div key={room.id} className="text-sm p-2 bg-muted rounded">
                      <div className="font-medium">Room {room.id + 1}</div>
                      <div className="text-muted-foreground">
                        Area: {room.area}px² | Perimeter: {room.perimeter}px | Points: {room.points.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">JSON Preview</Label>
                <pre className="text-xs bg-muted p-3 rounded max-h-32 overflow-auto">
                  {exportAsJSON()?.substring(0, 200)}...
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}