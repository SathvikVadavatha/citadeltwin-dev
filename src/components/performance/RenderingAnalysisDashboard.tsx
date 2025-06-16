
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useStablePerformanceMetrics } from '@/hooks/useStablePerformanceMetrics';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Zap,
  Clock
} from 'lucide-react';

interface RenderingIssue {
  id: string;
  type: 'infinite-loop' | 'memory-leak' | 'excessive-renders' | 'dependency-cycle';
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution: string;
}

export const RenderingAnalysisDashboard: React.FC = () => {
  const { metrics, isMonitoring, startMonitoring, stopMonitoring } = useStablePerformanceMetrics({
    enabled: true,
    interval: 2000,
    developmentOnly: false
  });

  const [detectedIssues, setDetectedIssues] = useState<RenderingIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulated rendering issue detection
  useEffect(() => {
    if (isMonitoring) {
      const mockIssues: RenderingIssue[] = [
        {
          id: 'metrics-deps',
          type: 'excessive-renders',
          component: 'useWorkflowMetrics',
          severity: 'medium',
          description: 'Query key dependencies causing unnecessary re-renders',
          solution: 'Use stable dependency arrays and memoized values'
        },
        {
          id: 'collab-debounce',
          type: 'dependency-cycle',
          component: 'useSimplifiedCollaboration',
          severity: 'high',
          description: 'Debounced functions recreated on every render',
          solution: 'Implement stable debounce with useCallback and refs'
        },
        {
          id: 'performance-interval',
          type: 'memory-leak',
          component: 'usePerformanceMetrics',
          severity: 'medium',
          description: 'Interval not properly cleaned up on unmount',
          solution: 'Use refs to track mounted state and cleanup intervals'
        },
        {
          id: 'realtime-channels',
          type: 'infinite-loop',
          component: 'useRealtimeManager',
          severity: 'high',
          description: 'Channels recreated due to dependency changes',
          solution: 'Memoize subscription configs and use stable references'
        }
      ];
      
      setDetectedIssues(mockIssues);
    }
  }, [isMonitoring]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsAnalyzing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'infinite-loop': return <RefreshCw className="w-4 h-4" />;
      case 'memory-leak': return <AlertTriangle className="w-4 h-4" />;
      case 'excessive-renders': return <Zap className="w-4 h-4" />;
      case 'dependency-cycle': return <Clock className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-500" />
              Rendering Analysis Dashboard
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={runAnalysis}
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
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
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

      {/* Detected Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Detected Rendering Issues ({detectedIssues.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detectedIssues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(issue.type)}
                    <h4 className="font-medium">{issue.component}</h4>
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <Badge variant="outline">{issue.type}</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {issue.description}
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Recommended Solution:</p>
                      <p className="text-sm text-green-700">{issue.solution}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {detectedIssues.length === 0 && !isAnalyzing && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No rendering issues detected</p>
                <p className="text-sm">Run analysis to check for potential problems</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p>Analyzing rendering patterns...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
