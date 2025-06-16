
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface FEAResultsVisualizerProps {
  analysisId: string;
}

export const FEAResultsVisualizer: React.FC<FEAResultsVisualizerProps> = ({
  analysisId
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Results Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Analysis results viewer</p>
          <p className="text-sm text-muted-foreground">Stress contours, displacement plots, and animations</p>
        </div>
      </CardContent>
    </Card>
  );
};
