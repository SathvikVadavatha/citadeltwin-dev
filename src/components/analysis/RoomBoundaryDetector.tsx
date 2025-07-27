import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useRoomBoundaryDetection } from '@/hooks/useRoomBoundaryDetection';
import { RoomDetectionOptions } from '@/utils/roomBoundaryDetection';
import { Upload, Download, Trash2, Eye, Settings, AlertCircle, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function RoomBoundaryDetector() {
  const {
    isLoading,
    isOpenCVLoading,
    openCVLoaded,
    result,
    error,
    canvasRef,
    detectRoomsFromFile,
    exportAsJSON,
    downloadJSON,
    clearResults,
    retryOpenCVLoad,
  } = useRoomBoundaryDetection();

  const [options, setOptions] = useState<RoomDetectionOptions>({
    targetSize: 512,
    thresholdValue: 127,
    minRoomArea: 1000,
    morphKernelSize: 3,
    polygonApproxFactor: 0.02,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('RoomBoundaryDetector component mounted');
    console.log('OpenCV loaded:', openCVLoaded);
  }, [openCVLoaded]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        console.log('File uploaded:', file.name, file.size, file.type);
        setSelectedFile(file);
        detectRoomsFromFile(file, options);
      }
    },
    [detectRoomsFromFile, options]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
    },
    multiple: false,
    disabled: isLoading || isOpenCVLoading,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleOptionChange = (key: keyof RoomDetectionOptions, value: number) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Room Boundary Detection</h2>
        <p className="text-muted-foreground">
          Upload a floor plan image to automatically detect room boundaries using computer vision
        </p>
      </div>

      {/* OpenCV Status */}
      {!openCVLoaded && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              {isOpenCVLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-orange-800 dark:text-orange-200">
                  {isOpenCVLoading ? 'Loading Computer Vision Library...' : 'Computer Vision Library Required'}
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  {isOpenCVLoading 
                    ? 'Please wait while we load the OpenCV.js library for image processing.' 
                    : 'The OpenCV.js library needs to be loaded before you can upload images.'
                  }
                </p>
              </div>
              {!isOpenCVLoading && (
                <Button
                  onClick={retryOpenCVLoad}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load OpenCV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                ? 'border-primary bg-primary/5'
                : isLoading || isOpenCVLoading || !openCVLoaded
                ? 'border-muted-foreground/25 bg-muted/20 cursor-not-allowed'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              {isLoading || isOpenCVLoading ? (
                <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              ) : (
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              )}
              
              <p className="text-lg font-medium text-foreground">
                {isLoading || isOpenCVLoading 
                  ? 'Processing...'
                  : isDragActive 
                  ? 'Drop the image here' 
                  : !openCVLoaded
                  ? 'Load OpenCV first to upload images'
                  : 'Drag & drop an image, or click to select'
                }
              </p>
              
              <p className="text-sm text-muted-foreground mt-2">
                {!openCVLoaded 
                  ? 'Computer vision library required for image processing'
                  : 'Supports PNG, JPG, GIF, and BMP files (max 10MB)'
                }
              </p>

              {selectedFile && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                    </Badge>
                  </div>
                </div>
              )}
            </div>
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
              onClick={() => {
                clearResults();
                setSelectedFile(null);
              }}
              disabled={!result && !selectedFile}
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Results
            </Button>
          </div>

          {/* Processing Indicator */}
          {(isLoading || isOpenCVLoading) && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="text-center py-4">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <p className="text-blue-800 dark:text-blue-200 font-medium">
                    {isOpenCVLoading ? 'Loading Computer Vision Library...' : 'Processing Image...'}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    {isOpenCVLoading 
                      ? 'This may take a few moments on first load'
                      : 'Analyzing floor plan and detecting room boundaries'
                    }
                  </p>
                  <Progress 
                    value={isOpenCVLoading ? 50 : 75} 
                    className="w-full max-w-xs mx-auto mt-3" 
                  />
                </div>
              </CardContent>
            </Card>
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