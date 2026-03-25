
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  Zap, 
  Database, 
  Cpu,
  Timer,
  TrendingUp,
  Settings,
  Trash2
} from 'lucide-react';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { PerformanceOptimizer } from '@/utils/performance/performanceOptimizer';

export const PerformanceDashboard: React.FC = () => {
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { metrics, isMonitoring, startMonitoring, stopMonitoring } = usePerformanceMetrics({
    enabled: monitoringEnabled,
    interval: 5000, // 5 second intervals instead of 1 second
    developmentOnly: true
  });

  const [cacheStats, setCacheStats] = useState(() => PerformanceOptimizer.getCacheStats());

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
      default: return 'text-muted-foreground';
    }
  };

  const handleToggleMonitoring = () => {
    if (monitoringEnabled) {
      setMonitoringEnabled(false);
      stopMonitoring();
    } else {
      setMonitoringEnabled(true);
      startMonitoring();
    }
  };

  const handleCacheCleanup = () => {
    PerformanceOptimizer.clearExpiredCache();
    setCacheStats(PerformanceOptimizer.getCacheStats());
  };

  const handleForceCacheCleanup = () => {
    PerformanceOptimizer.forceCacheCleanup();
    setCacheStats(PerformanceOptimizer.getCacheStats());
  };

  const refreshCacheStats = () => {
    setCacheStats(PerformanceOptimizer.getCacheStats());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Performance Dashboard
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={monitoringEnabled}
              onCheckedChange={handleToggleMonitoring}
            />
            <span className="text-sm">Live Monitoring</span>
          </div>
          <Badge className={isMonitoring ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-muted-foreground'}>
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </Badge>
        </div>
      </div>

      {/* Cache Management Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache Management
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={refreshCacheStats}>
                <Settings className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={handleCacheCleanup}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clean Expired
              </Button>
              <Button size="sm" variant="destructive" onClick={handleForceCacheCleanup}>
                <Trash2 className="h-4 w-4 mr-1" />
                Force Clean
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{cacheStats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">Cache Entries</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {Math.round(cacheStats.memoryUsage / 1024)}KB
              </div>
              <p className="text-xs text-muted-foreground">Memory Usage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {cacheStats.oldestEntry ? Math.round((Date.now() - cacheStats.oldestEntry) / 60000) : 0}m
              </div>
              <p className="text-xs text-muted-foreground">Oldest Entry</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {Array.from(cacheStats.hitRates.values()).reduce((a, b) => a + b, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total Hits</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics - Only show when monitoring is enabled */}
      {isMonitoring && (
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
        </div>
      )}

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!isMonitoring && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded text-blue-600">
                <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Enable monitoring to see real-time performance metrics and recommendations.</p>
              </div>
            )}
            
            {isMonitoring && metrics.frameRate < 30 && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded text-destructive">
                <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Low frame rate detected. Consider reducing 3D complexity or enabling performance mode.</p>
              </div>
            )}
            
            {cacheStats.totalEntries > 80 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded text-yellow-600">
                <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Cache is getting full ({cacheStats.totalEntries} entries). Consider cleaning expired entries.</p>
              </div>
            )}
            
            {isMonitoring && metrics.frameRate >= 50 && metrics.memoryUsage < 100 && metrics.cacheHitRatio > 85 && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded text-green-600">
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
