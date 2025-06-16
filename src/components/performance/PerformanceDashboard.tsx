
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Zap, 
  Database, 
  Cpu,
  Timer,
  TrendingUp
} from 'lucide-react';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';

export const PerformanceDashboard: React.FC = () => {
  const { metrics, isMonitoring } = usePerformanceMetrics();

  const getPerformanceStatus = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1]) return 'excellent';
    if (value >= thresholds[0]) return 'good';
    return 'needs-improvement';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'needs-improvement': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Performance Dashboard
        </h3>
        <Badge className={isMonitoring ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
          {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Frame Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Frame Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus(metrics.frameRate, [30, 50]))}`}>
                {metrics.frameRate} FPS
              </div>
              <Progress value={(metrics.frameRate / 60) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Target: 60 FPS
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus(100 - metrics.memoryUsage, [70, 85]))}`}>
                {metrics.memoryUsage} MB
              </div>
              <Progress value={Math.min((metrics.memoryUsage / 100) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Recommended: &lt; 100 MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Render Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Render Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus(16.67 - metrics.renderTime, [8, 12]))}`}>
                {metrics.renderTime.toFixed(1)} ms
              </div>
              <Progress value={Math.min((metrics.renderTime / 16.67) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Target: &lt; 16.67 ms
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Database Queries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Query Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-500">
                {metrics.queryCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Active Queries
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cache Hit Ratio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cache Hit Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus(metrics.cacheHitRatio, [70, 85]))}`}>
                {metrics.cacheHitRatio.toFixed(1)}%
              </div>
              <Progress value={metrics.cacheHitRatio} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Target: &gt; 85%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Load Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Page Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus(3000 - metrics.loadTime, [1000, 2000]))}`}>
                {(metrics.loadTime / 1000).toFixed(2)}s
              </div>
              <p className="text-xs text-muted-foreground">
                Target: &lt; 2s
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.frameRate < 30 && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded text-red-400">
                <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Low frame rate detected. Consider reducing 3D complexity or enabling performance mode.</p>
              </div>
            )}
            
            {metrics.memoryUsage > 100 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded text-yellow-400">
                <Cpu className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">High memory usage. Clear browser cache or close unused tabs.</p>
              </div>
            )}
            
            {metrics.cacheHitRatio < 70 && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded text-blue-400">
                <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Low cache efficiency. Consider adjusting cache strategies.</p>
              </div>
            )}
            
            {metrics.frameRate >= 50 && metrics.memoryUsage < 100 && metrics.cacheHitRatio > 85 && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded text-green-400">
                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Excellent performance! All metrics are within optimal ranges.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
