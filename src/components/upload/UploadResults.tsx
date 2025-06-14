
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box } from "lucide-react";
import { Model3DViewer } from "@/components/3d/Model3DViewer";
import { FloorPlanAnalyzer } from "@/components/analysis/FloorPlanAnalyzer";
import { SceneGenerator } from "@/components/3d/SceneGenerator";
import { supabase } from "@/integrations/supabase/client";

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

interface FloorPlanData {
  rooms: Array<{
    id: string;
    type: 'bedroom' | 'living_room' | 'kitchen' | 'bathroom' | 'hallway';
    bounds: { x: number; y: number; width: number; height: number };
    area: number;
  }>;
  walls: Array<{
    id: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
    thickness: number;
  }>;
  doors: Array<{
    id: string;
    position: { x: number; y: number };
    width: number;
    wallId: string;
  }>;
  windows: Array<{
    id: string;
    position: { x: number; y: number };
    width: number;
    wallId: string;
  }>;
  scale: number;
}

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects: DetectedObject[];
  imageUrl: string;
  processingTime?: number;
  generated3DModels?: Generated3DModel[];
  floorPlanData?: FloorPlanData;
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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plan2Scene Analysis Results</h2>
        <Button variant="outline" onClick={onReset}>
          Upload Another Blueprint
        </Button>
      </div>

      <div className="space-y-6">
        {/* Floor Plan Analysis */}
        {uploadResult.floorPlanData && (
          <FloorPlanAnalyzer
            imageUrl={uploadResult.imageUrl}
            analysisData={uploadResult.floorPlanData}
          />
        )}

        {/* 3D Scene Generation */}
        {uploadResult.floorPlanData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-blue-500" />
                Generated 3D Scene
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SceneGenerator floorPlanData={uploadResult.floorPlanData} />
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Interactive 3D scene with rooms, walls, and furniture based on Plan2Scene techniques
              </p>
            </CardContent>
          </Card>
        )}

        {/* Original 3D Models */}
        {uploadResult.generated3DModels && uploadResult.generated3DModels.length > 0 && (
          <div className="space-y-4">
            {uploadResult.generated3DModels.map((model) => {
              const modelUrl = supabase.storage.from('3d-models').getPublicUrl(model.model_file_path).data.publicUrl;
              
              return (
                <div key={model.id}>
                  <Model3DViewer
                    modelUrl={modelUrl}
                    modelName={model.model_name}
                    onDownload={() => onDownload3DModel(model)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
