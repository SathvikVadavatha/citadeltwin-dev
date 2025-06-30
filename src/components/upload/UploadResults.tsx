
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedBlueprintAnalysis } from '@/components/analysis/EnhancedBlueprintAnalysis';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  Box,
  Image,
  Brain,
  Zap
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('analysis');

  const totalObjects = uploadResult.detectedObjects?.length || 0;
  const totalRooms = uploadResult.floorPlanData?.rooms?.length || 0;
  const total3DModels = uploadResult.generated3DModels?.length || 0;

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Processing Complete
              </CardTitle>
              <CardDescription>
                Successfully processed {uploadResult.filename}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Upload Another
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Image className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-lg font-semibold text-blue-700">{totalObjects}</div>
                <div className="text-sm text-blue-600">Objects Detected</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Brain className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-lg font-semibold text-green-700">{totalRooms}</div>
                <div className="text-sm text-green-600">Rooms Analyzed</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Box className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-lg font-semibold text-purple-700">{total3DModels}</div>
                <div className="text-sm text-purple-600">3D Models</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-lg font-semibold text-orange-700">
                  {uploadResult.processingTime ? `${(uploadResult.processingTime / 1000).toFixed(1)}s` : 'N/A'}
                </div>
                <div className="text-sm text-orange-600">Processing Time</div>
              </div>
            </div>
          </div>

          {uploadResult.geminiAnalysis && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Enhanced with Gemini AI</span>
              </div>
              <p className="text-sm text-yellow-700">
                Advanced AI analysis completed with architectural element recognition and spatial understanding.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Blueprint Analysis
          </TabsTrigger>
          <TabsTrigger value="3d-models" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            3D Models ({total3DModels})
          </TabsTrigger>
          <TabsTrigger value="raw-data" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Raw Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <EnhancedBlueprintAnalysis uploadResult={uploadResult} />
        </TabsContent>

        <TabsContent value="3d-models" className="space-y-4">
          {uploadResult.generated3DModels && uploadResult.generated3DModels.length > 0 ? (
            <div className="grid gap-4">
              {uploadResult.generated3DModels.map((model) => (
                <Card key={model.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5" />
                      {model.model_name}
                    </CardTitle>
                    <CardDescription>{model.model_description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={model.generation_status === 'completed' ? 'default' : 'secondary'}>
                            {model.generation_status}
                          </Badge>
                          {model.processing_time_ms && (
                            <span className="text-sm text-muted-foreground">
                              Generated in {(model.processing_time_ms / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          File size: {(model.file_size / 1024).toFixed(1)} KB
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No 3D models generated yet</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="raw-data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Detection Data</CardTitle>
              <CardDescription>JSON data from the analysis process</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify({
                  detectedObjects: uploadResult.detectedObjects,
                  floorPlanData: uploadResult.floorPlanData,
                  geminiAnalysis: typeof uploadResult.geminiAnalysis === 'string' 
                    ? uploadResult.geminiAnalysis.substring(0, 500) + '...'
                    : uploadResult.geminiAnalysis,
                  generated3DModels: uploadResult.generated3DModels
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
