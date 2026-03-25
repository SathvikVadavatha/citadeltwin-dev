
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Database,
  Zap,
  Globe,
  Shield
} from 'lucide-react';
import { SystemDiagnostics, type SystemHealth, type DiagnosticResult } from '@/utils/diagnostics/systemDiagnostics';

export const DiagnosticHealthCheck: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const health = await SystemDiagnostics.runComprehensiveDiagnostics();
      setSystemHealth(health);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run initial diagnostics
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'database': return <Database className="w-5 h-5" />;
      case 'memory': return <Zap className="w-5 h-5" />;
      case 'api performance': return <Globe className="w-5 h-5" />;
      case 'performance': return <Activity className="w-5 h-5" />;
      case 'error rate': return <AlertTriangle className="w-5 h-5" />;
      case 'data integrity': return <Shield className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Running system diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            System Health Diagnostics
          </h3>
          <p className="text-muted-foreground">
            Real-time monitoring and health checks for all system components
          </p>
        </div>
        <Button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Run Diagnostics'}
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              {getStatusIcon(systemHealth.overallStatus)}
              <div>
                <div className={`text-4xl font-bold ${getStatusColor(systemHealth.overallStatus)}`}>
                  {systemHealth.score}%
                </div>
                <div className="text-sm text-muted-foreground">System Health Score</div>
              </div>
            </div>
            <Progress value={systemHealth.score} className="h-3" />
            <Badge className={`${systemHealth.overallStatus === 'healthy' ? 'bg-green-500/20 text-green-600' : systemHealth.overallStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-destructive'}`}>
              {systemHealth.overallStatus.toUpperCase()}
            </Badge>
            {lastCheck && (
              <div className="text-xs text-muted-foreground">
                Last check: {lastCheck.toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      <div className="grid gap-4">
        {systemHealth.results.map((result, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(result.category)}
                  <div>
                    <h4 className="font-medium">{result.category}</h4>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <Badge className={`${result.status === 'healthy' ? 'bg-green-500/20 text-green-600' : result.status === 'warning' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-destructive'}`}>
                    {result.status}
                  </Badge>
                </div>
              </div>
              
              {result.details && (
                <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {systemHealth.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemHealth.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
