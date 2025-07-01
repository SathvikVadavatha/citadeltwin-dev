import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Model3DViewer } from "@/components/3d/Model3DViewer";
import { SceneGenerator } from "@/components/3d/SceneGenerator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  Download, 
  RotateCcw, 
  RotateCw,
  Building2, 
  Eye, 
  Home, 
  Box,
  AlertCircle,
  CheckCircle,
  Brain,
  TestTube,
  RefreshCw
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
  processingMethod?: 'ai' | 'fallback';
  errorMessage?: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'blueprint' | 'analysis' | '3d-view'>('overview');
  const [imageError, setImageError] = useState(false);

  console.log('UploadResults received:', uploadResult);

  const totalDetectedObjects = uploadResult.detectedObjects?.length || 0;
  const totalRooms = uploadResult.floorPlanData?.rooms?.length || 0;
  const totalArea = uploadResult.floorPlanData?.rooms?.reduce((sum: number, room: any) => sum + (room.area || 0), 0) || 0;
  const isAIGenerated = uploadResult.processingMethod === 'ai';
  const isFallback = uploadResult.processingMethod === 'fallback';
  const has3DModels = uploadResult.generated3DModels && uploadResult.generated3DModels.length > 0;

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load blueprint image:', uploadResult.imageUrl);
  };

  const handleImageLoad = () => {
    setImageError(false);
    console.log('Image loaded successfully:', uploadResult.imageUrl);
  };

  // Get model URL for 3D viewer
  const get3DModelUrl = (model: Generated3DModel) => {
    if (!model || model.model_file_path === 'placeholder.glb') {
      return null;
    }
    
    // Get public URL from Supabase storage
    const { data } = supabase.storage
      .from('3d-models')
      .getPublicUrl(model.model_file_path);
    
    return data.publicUrl;
  };

  const primary3DModel = uploadResult.generated3DModels?.[0];
  const modelUrl = primary3DModel ? get3DModelUrl(primary3DModel) : null;
  
  console.log('3D Model Debug:', {
    primary3DModel,
    modelUrl,
    uploadId: uploadResult.id,
    has3DModels,
    hasFloorPlanData: !!uploadResult.floorPlanData
  });

  return (
    <div className="space-y-6">
      {/* Processing Status Alert */}
      {isFallback && (
        <Alert className="border-orange-200 bg-orange-50">
          <TestTube className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Sample Analysis Mode:</strong> Plan2Scene processing was temporarily unavailable, so we're showing enhanced sample architectural elements. 
            This demonstrates typical blueprint detection capabilities with realistic data patterns.
            <Button variant="link" className="h-auto p-0 ml-2 text-orange-700 underline" onClick={onReset}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Try uploading again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isAIGenerated && (
        <Alert className="border-green-200 bg-green-50">
          <Brain className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Plan2Scene Analysis Complete:</strong> Your blueprint was successfully processed using the open-source Plan2Scene engine for accurate architectural element detection and 3D model generation.
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
                {isAIGenerated ? (
                  <Badge variant="default" className="bg-green-600">
                    <Brain className="h-3 w-3 mr-1" />
                    Plan2Scene AI
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <TestTube className="h-3 w-3 mr-1" />
                    Enhanced Sample
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {isAIGenerated 
                  ? `Plan2Scene open-source analysis of ${uploadResult.filename}`
                  : `Enhanced sample analysis for ${uploadResult.filename} (Plan2Scene temporarily unavailable)`
                }
              </p>
            </div>
            <Button onClick={onReset} variant="outline">
              <RotateCw className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalDetectedObjects}</div>
              <div className="text-sm text-muted-foreground">
                {isAIGenerated ? 'Elements Detected' : 'Sample Elements'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalRooms}</div>
              <div className="text-sm text-muted-foreground">
                {isAIGenerated ? 'Rooms Identified' : 'Sample Rooms'}
              </div>
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
        <Button
          variant={activeTab === '3d-view' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('3d-view')}
          className="flex-1"
        >
          <Box className="h-4 w-4 mr-2" />
          3D View
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
                  <Badge variant={isAIGenerated ? "default" : "secondary"}>
                    {isAIGenerated ? (
                      <>
                        <Brain className="h-3 w-3 mr-1" />
                        Plan2Scene
                      </>
                    ) : (
                      <>
                        <TestTube className="h-3 w-3 mr-1" />
                        Sample Mode
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Elements Found:</span>
                  <Badge variant="secondary">{totalDetectedObjects}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rooms Detected:</span>
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
                {uploadResult.processingTime && (
                  <div className="flex justify-between items-center">
                    <span>Processing Time:</span>
                    <Badge variant="outline">{(uploadResult.processingTime / 1000).toFixed(1)}s</Badge>
                  </div>
                )}
                {uploadResult.errorMessage && isFallback && (
                  <div className="flex justify-between items-center">
                    <span>Fallback Reason:</span>
                    <Badge variant="outline" className="text-orange-600">Processing Error</Badge>
                  </div>
                )}
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

      {activeTab === '3d-view' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              3D Model Viewer
              {(has3DModels || uploadResult.floorPlanData) && (
                <Badge variant="outline" className="ml-2">
                  Interactive
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Interactive 3D visualization of your blueprint analysis.</p>
              </div>
              <div className="h-96 border rounded-lg overflow-hidden">
                {modelUrl ? (
                  <Model3DViewer 
                    modelUrl={modelUrl}
                    modelName={primary3DModel?.model_name}
                    uploadId={uploadResult.id}
                    projectId={uploadResult.id}
                    onDownload={() => primary3DModel && onDownload3DModel(primary3DModel)}
                  />
                ) : uploadResult.floorPlanData && uploadResult.floorPlanData.rooms?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>Floor plan visualization generated from detected elements.</p>
                    </div>
                    <SceneGenerator floorPlanData={uploadResult.floorPlanData} />
                  </div>
                ) : (
                  <Model3DViewer 
                    uploadId={uploadResult.id}
                    projectId={uploadResult.id}
                  />
                )}
              </div>
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
                {isAIGenerated ? 'Detected Elements' : 'Sample Elements'} ({totalDetectedObjects})
                {isFallback && (
                  <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                    Enhanced Sample
                  </Badge>
                )}
                {isAIGenerated && (
                  <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                    Plan2Scene AI
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
                          {isAIGenerated && (
                            <span className="text-xs text-green-600">AI Detected</span>
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
                        <h5 className="font-medium">{room.name || `Room ${index + 1}`}</h5>
                        <Badge variant="outline" className="capitalize">
                          {room.type || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Area: {room.area || 0} ft²</div>
                        {room.bounds && (
                          <div>
                            Dimensions: {room.bounds.width || 0}×{room.bounds.height || 0} ft
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
                          {isFallback && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Sample Model
                            </Badge>
                          )}
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
                  <p><strong>Plan2Scene Status:</strong> <span className="text-orange-600">Temporarily unavailable</span></p>
                  <p><strong>Fallback Mode:</strong> Enhanced sample data generated</p>
                  <p><strong>Technical Details:</strong> {uploadResult.errorMessage}</p>
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                    <p className="text-orange-800 text-sm">
                      <strong>Note:</strong> The sample data shown above represents realistic architectural elements 
                      that would typically be detected by Plan2Scene. When the service is available, you'll get 
                      actual AI-powered analysis of your specific blueprint.
                    </p>
                  </div>
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
