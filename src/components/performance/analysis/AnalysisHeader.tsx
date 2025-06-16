
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, RefreshCw } from 'lucide-react';

interface AnalysisHeaderProps {
  metrics: {
    frameRate: number;
    memoryUsage: number;
    renderTime: number;
    cacheHitRatio: number;
  };
  isMonitoring: boolean;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onToggleMonitoring: () => void;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({
  metrics,
  isMonitoring,
  isAnalyzing,
  onRunAnalysis,
  onToggleMonitoring
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Rendering Analysis Dashboard
          </span>
          <div className="flex gap-2">
            <Button 
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Analyze
            </Button>
            
            <Button 
              onClick={onToggleMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Frame Rate</p>
            <p className="text-2xl font-bold">{metrics.frameRate} fps</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Memory Usage</p>
            <p className="text-2xl font-bold">{metrics.memoryUsage} MB</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Render Time</p>
            <p className="text-2xl font-bold">{metrics.renderTime.toFixed(1)} ms</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Cache Hit Ratio</p>
            <p className="text-2xl font-bold">{metrics.cacheHitRatio.toFixed(0)}%</p>
          </div>
        </div>
        
        {isMonitoring && (
          <div className="mt-4">
            <Progress value={metrics.cacheHitRatio} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Performance Score: {metrics.cacheHitRatio.toFixed(0)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
