
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
  Ruler,
  Box,
  AlertCircle,
  CheckCircle,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { EnhancedBlueprintAnalysis } from "@/components/analysis/EnhancedBlueprintAnalysis";

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
  const [activeTab, setActiveTab] = useState<'analysis' | 'floorplan' | 'models'>('analysis');
  const [imageError, setImageError] = useState(false);

  console.log('UploadResults received data:', uploadResult);

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

  // Debug logging
  console.log('Floor plan data:', uploadResult.floorPlanData);
  console.log('Detected objects:', uploadResult.detectedObjects);
  console.log('Image URL:', uploadResult.imageUrl);

  return (
    <div className="space-y-6">
      {/* Header with Results Summary */}
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
          variant={activeTab === 'analysis' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('analysis')}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-2" />
          Blueprint Analysis
        </Button>
        <Button
          variant={activeTab === 'floorplan' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('floorplan')}
          className="flex-1"
        >
          <Home className="h-4 w-4 mr-2" />
          Floor Plan
        </Button>
        <Button
          variant={activeTab === 'models' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('models')}
          className="flex-1"
        >
          <Box className="h-4 w-4 mr-2" />
          3D Models
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'analysis' && (
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
                      <p>Failed to load blueprint image</p>
                      <p className="text-sm mt-1 break-all">URL: {uploadResult.imageUrl}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setImageError(false);
                          console.log('Retrying image load...');
                        }}
                      >
                        Retry Loading
                      </Button>
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

          {/* Detected Objects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detected Elements ({totalDetectedObjects})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
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
                      <p>No elements detected yet</p>
                      <p className="text-sm">Processing may still be in progress</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'floorplan' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Floor Plan Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadResult.floorPlanData?.rooms && uploadResult.floorPlanData.rooms.length > 0 ? (
              <div className="space-y-6">
                {/* Room Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalRooms}</div>
                    <div className="text-sm text-blue-600">Total Rooms</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{Math.round(totalArea)}</div>
                    <div className="text-sm text-green-600">Total Area (ft²)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {uploadResult.floorPlanData?.dimensions?.width || 'N/A'}×{uploadResult.floorPlanData?.dimensions?.height || 'N/A'}
                    </div>
                    <div className="text-sm text-purple-600">Dimensions (ft)</div>
                  </div>
                </div>

                <Separator />

                {/* Rooms List */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Room Details
                  </h4>
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
                          <div>
                            Dimensions: {room.bounds?.width}×{room.bounds?.height} ft
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Floor Plan Analysis in Progress</h3>
                <p>The AI is analyzing your blueprint to detect rooms and floor plan elements.</p>
                <p className="text-sm mt-2">This may take a few moments to complete.</p>
                {uploadResult.geminiAnalysis && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      {typeof uploadResult.geminiAnalysis === 'string' 
                        ? uploadResult.geminiAnalysis 
                        : 'Analysis data received but room extraction is in progress...'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'models' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Generated 3D Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadResult.generated3DModels && uploadResult.generated3DModels.length > 0 ? (
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
                      Download GLB
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">3D Model Generation</h3>
                <p>3D models will be generated once the blueprint analysis is complete.</p>
                <p className="text-sm">This process may take several minutes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Blueprint Analysis Component - only show if we have data */}
      {(uploadResult.detectedObjects?.length > 0 || uploadResult.floorPlanData?.rooms?.length > 0) && (
        <EnhancedBlueprintAnalysis uploadResult={uploadResult} />
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
