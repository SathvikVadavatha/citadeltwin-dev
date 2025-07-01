
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Download, 
  RotateCcw, 
  Building2, 
  Eye, 
  Home, 
  Box,
  AlertCircle,
  CheckCircle
} from "lucide-react";

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
  detectedObjects: any[];
  imageUrl: string;
  processingTime?: number;
  generated3DModels?: Generated3DModel[];
  floorPlanData?: any;
  geminiAnalysis?: any;
}

interface UploadResultsProps {
  uploadResult: UploadResult;
  onReset: () => void;
  onDownload3DModel: (model: Generated3DModel) => void;
}

export const UploadResults: React.FC<UploadResultsProps> = ({
  uploadResult,
  onReset,
  onDownload3DModel
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'blueprint' | 'analysis'>('overview');
  const [imageError, setImageError] = useState(false);

  console.log('UploadResults received:', uploadResult);

  const totalDetectedObjects = uploadResult.detectedObjects?.length || 0;
  const totalRooms = uploadResult.floorPlanData?.rooms?.length || 0;
  const totalArea = uploadResult.floorPlanData?.rooms?.reduce((sum: number, room: any) => sum + (room.area || 0), 0) || 0;

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load blueprint image:', uploadResult.imageUrl);
  };

  const handleImageLoad = () => {
    setImageError(false);
    console.log('Image loaded successfully:', uploadResult.imageUrl);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Analysis Complete
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Successfully processed {uploadResult.filename}
              </p>
            </div>
            <Button onClick={onReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalDetectedObjects}</div>
              <div className="text-sm text-muted-foreground">Elements Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalRooms}</div>
              <div className="text-sm text-muted-foreground">Rooms Identified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(totalArea)}</div>
              <div className="text-sm text-muted-foreground">Total Area (ft²)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {uploadResult.generated3DModels?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">3D Models</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
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
                      <p>Image not available</p>
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
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Elements Detected:</span>
                  <Badge variant="secondary">{totalDetectedObjects}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rooms Found:</span>
                  <Badge variant="secondary">{totalRooms}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Area:</span>
                  <Badge variant="secondary">{Math.round(totalArea)} ft²</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>3D Models:</span>
                  <Badge variant="secondary">{uploadResult.generated3DModels?.length || 0}</Badge>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
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
                                {Math.round(obj.bbox.width)}×{Math.round(obj.bbox.height)} px
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {Math.round((obj.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No elements detected</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Floor Plan Data */}
          {uploadResult.floorPlanData?.rooms && uploadResult.floorPlanData.rooms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Room Analysis ({totalRooms})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadResult.floorPlanData.rooms.map((room: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{room.name}</h5>
                        <Badge variant="outline" className="capitalize">
                          {room.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Area: {room.area} ft²</div>
                        {room.bounds && (
                          <div>
                            Dimensions: {room.bounds.width}×{room.bounds.height} ft
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3D Models */}
          {uploadResult.generated3DModels && uploadResult.generated3DModels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Generated 3D Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadResult.generated3DModels.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{model.model_name}</h4>
                        <p className="text-sm text-muted-foreground">{model.model_description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {(model.file_size / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                          <Badge 
                            variant={model.generation_status === 'completed' ? 'default' : 'secondary'}
                          >
                            {model.generation_status}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        onClick={() => onDownload3DModel(model)}
                        disabled={model.generation_status !== 'completed'}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
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
    column: '#64748b'
  };
  return colors[label?.toLowerCase()] || '#6b7280';
}
