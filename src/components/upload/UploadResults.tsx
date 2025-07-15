import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallDetection } from "@/hooks/useWallDetection";
import { 
  Upload, 
  RotateCw,
  Building2, 
  Eye, 
  Home,
  AlertCircle,
  TestTube,
  RefreshCw,
  Activity
} from "lucide-react";

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects: any[];
  imageUrl: string;
  processingTime?: number;
  processingMethod?: 'ai' | 'fallback';
  errorMessage?: string;
}

interface UploadResultsProps {
  uploadResult: UploadResult;
  onReset: () => void;
}

export const UploadResults: React.FC<UploadResultsProps> = ({
  uploadResult,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'blueprint' | 'analysis'>('overview');
  const [imageError, setImageError] = useState(false);
  const { isLoading: isDetectingWalls, detectWallsFromUrl } = useWallDetection();

  console.log('UploadResults received:', uploadResult);

  const totalDetectedObjects = uploadResult.detectedObjects?.length || 0;
  const isAIGenerated = uploadResult.processingMethod === 'ai';
  const isFallback = uploadResult.processingMethod === 'fallback';

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load blueprint image:', uploadResult.imageUrl);
  };

  const handleImageLoad = () => {
    setImageError(false);
    console.log('Image loaded successfully:', uploadResult.imageUrl);
  };

  const handleWallDetection = async () => {
    if (uploadResult.imageUrl) {
      const wallResults = await detectWallsFromUrl(uploadResult.imageUrl);
      if (wallResults) {
        console.log('Wall detection results:', wallResults);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Processing Status Alert */}
      {isFallback && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
          <TestTube className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Fallback Mode:</strong> Processing completed using fallback algorithms.
            <div className="mt-2 text-sm">
              <span className="opacity-75">Generated architectural elements using text extraction and object detection algorithms.</span>
            </div>
            <Button variant="link" className="h-auto p-0 ml-2 text-orange-700 dark:text-orange-300 underline" onClick={onReset}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Try uploading again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Analysis Complete
                <Badge variant={isFallback ? "secondary" : "default"}>
                  <TestTube className="h-3 w-3 mr-1" />
                  {isFallback ? 'Fallback' : 'Standard'}
                </Badge>
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Processed {uploadResult.filename} using {isFallback ? 'fallback algorithms' : 'standard processing'}
              </p>
            </div>
            <Button onClick={onReset} variant="outline">
              <RotateCw className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalDetectedObjects}</div>
              <div className="text-sm text-muted-foreground">Detected Elements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{isFallback ? 'Fallback' : 'Standard'}</div>
              <div className="text-sm text-muted-foreground">Processing Method</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {uploadResult.processingTime ? (uploadResult.processingTime / 1000).toFixed(1) + 's' : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Processing Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'blueprint' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('blueprint')}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Blueprint
        </Button>
        <Button
          variant={activeTab === 'analysis' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('analysis')}
          className="flex-1"
        >
          <Home className="h-4 w-4 mr-2" />
          Analysis
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blueprint Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Original Blueprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border rounded-lg overflow-hidden bg-gray-50 h-96">
                {imageError ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Image loading failed</p>
                      <p className="text-xs mt-1 break-all">{uploadResult.imageUrl}</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={uploadResult.imageUrl}
                    alt="Blueprint"
                    className="w-full h-full object-contain"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Processing Engine:</span>
                  <Badge variant={isFallback ? "secondary" : "default"}>
                    <TestTube className="h-3 w-3 mr-1" />
                    {isFallback ? 'Fallback' : 'Standard'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Elements Found:</span>
                  <Badge variant="secondary">{totalDetectedObjects}</Badge>
                </div>
                {uploadResult.processingTime && (
                  <div className="flex justify-between items-center">
                    <span>Processing Time:</span>
                    <Badge variant="outline">{(uploadResult.processingTime / 1000).toFixed(1)}s</Badge>
                  </div>
                )}
                <div className="pt-2">
                  <Button 
                    onClick={handleWallDetection} 
                    disabled={isDetectingWalls || !uploadResult.imageUrl}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    {isDetectingWalls ? 'Detecting Walls...' : 'Detect Walls (OpenCV)'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'blueprint' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Blueprint Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border rounded-lg overflow-hidden bg-gray-50" style={{ minHeight: '500px' }}>
              {imageError ? (
                <div className="flex items-center justify-center h-full text-muted-foreground p-8">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Blueprint Not Available</h3>
                    <p className="text-sm">Unable to load the blueprint image</p>
                    <p className="text-xs mt-2 break-all">URL: {uploadResult.imageUrl}</p>
                  </div>
                </div>
              ) : (
                <img
                  src={uploadResult.imageUrl}
                  alt="Blueprint"
                  className="w-full h-full object-contain"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  style={{ minHeight: '500px' }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Detected Objects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detected Elements ({totalDetectedObjects})
                {isFallback && (
                  <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300 bg-orange-50">
                    Fallback
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {uploadResult.detectedObjects && uploadResult.detectedObjects.length > 0 ? (
                    uploadResult.detectedObjects.map((obj, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getColorForLabel(obj.label) }}
                          />
                          <div>
                            <div className="font-medium capitalize">{obj.label}</div>
                            {obj.bbox && (
                              <div className="text-sm text-muted-foreground">
                                {Math.round(obj.bbox.width)}×{Math.round(obj.bbox.height)} units
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary">
                            {Math.round((obj.confidence || 0) * 100)}%
                          </Badge>
                          {isFallback && (
                            <span className="text-xs text-orange-600 font-medium">Fallback</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No elements detected in this analysis</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Processing Info */}
          {uploadResult.errorMessage && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-5 w-5" />
                  Processing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p><strong>Processing Mode:</strong> <span className="text-orange-600">Fallback algorithms</span></p>
                  <p><strong>Technical Details:</strong> {uploadResult.errorMessage}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={onReset}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Try Different Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get colors for different labels
function getColorForLabel(label: string): string {
  const colors: Record<string, string> = {
    wall: '#ef4444',
    door: '#22c55e', 
    window: '#3b82f6',
    room: '#8b5cf6',
    kitchen: '#f59e0b',
    bedroom: '#ec4899',
    bathroom: '#06b6d4',
    fixture: '#84cc16',
    beam: '#f97316',
    column: '#64748b',
    stairs: '#ec4899',
    closet: '#8b5cf6'
  };
  return colors[label?.toLowerCase()] || '#6b7280';
}