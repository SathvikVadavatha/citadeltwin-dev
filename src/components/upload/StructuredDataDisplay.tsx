import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StructuredBlueprintData } from '@/hooks/blueprint/useBlueprintAnalysis';

interface StructuredDataDisplayProps {
  data: StructuredBlueprintData;
}

export const StructuredDataDisplay: React.FC<StructuredDataDisplayProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Analysis Quality
            <Badge variant={data.qualityMetrics.overallConfidence > 0.8 ? "default" : "secondary"}>
              {Math.round(data.qualityMetrics.overallConfidence * 100)}% Confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Confidence</span>
                <span>{Math.round(data.qualityMetrics.overallConfidence * 100)}%</span>
              </div>
              <Progress value={data.qualityMetrics.overallConfidence * 100} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Elements Detected:</span>
                <div className="text-muted-foreground">{data.qualityMetrics.detectedElementsCount}</div>
              </div>
              <div>
                <span className="font-medium">Image Quality:</span>
                <div className="text-muted-foreground capitalize">{data.qualityMetrics.imageQuality}</div>
              </div>
              <div>
                <span className="font-medium">Processing Time:</span>
                <div className="text-muted-foreground">{data.qualityMetrics.processingTime}ms</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Building Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Building Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Type:</span>
              <div className="text-muted-foreground capitalize">{data.metadata.type}</div>
            </div>
            <div>
              <span className="font-medium">Style:</span>
              <div className="text-muted-foreground capitalize">{data.metadata.style}</div>
            </div>
            <div>
              <span className="font-medium">Construction:</span>
              <div className="text-muted-foreground capitalize">{data.metadata.constructionMethod}</div>
            </div>
            <div>
              <span className="font-medium">Occupancy:</span>
              <div className="text-muted-foreground capitalize">{data.metadata.occupancyType}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scale Information */}
      <Card>
        <CardHeader>
          <CardTitle>Scale & Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Unit:</span>
              <div className="text-muted-foreground capitalize">{data.scale.unit}</div>
            </div>
            <div>
              <span className="font-medium">Total Area:</span>
              <div className="text-muted-foreground">{data.scale.totalArea.toLocaleString()} sq {data.scale.unit}</div>
            </div>
            <div>
              <span className="font-medium">Floors:</span>
              <div className="text-muted-foreground">{data.scale.floorCount}</div>
            </div>
            <div>
              <span className="font-medium">Scale:</span>
              <div className="text-muted-foreground">{data.scale.pixelsPerUnit} px/{data.scale.unit}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms */}
      <Card>
        <CardHeader>
          <CardTitle>Rooms ({data.rooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">{room.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{room.area} sq {data.scale.unit}</div>
                  <div className="text-sm text-muted-foreground">
                    {room.doors.length} doors, {room.windows.length} windows
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architectural Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Elements ({data.elements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.elements.map((element) => (
              <div key={element.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {element.type}
                  </Badge>
                  <span className="text-sm">{element.label}</span>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">
                    {Math.round(element.confidence * 100)}% confidence
                  </div>
                  {element.dimensions.area && (
                    <div className="text-muted-foreground">
                      {element.dimensions.area} sq {data.scale.unit}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw JSON Export */}
      <Card>
        <CardHeader>
          <CardTitle>Structured Data (JSON)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};