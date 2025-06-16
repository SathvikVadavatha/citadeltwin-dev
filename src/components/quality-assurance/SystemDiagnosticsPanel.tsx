
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Activity, Zap, Database, Cpu } from 'lucide-react';
import { SystemDiagnostics, SystemHealth, DiagnosticResult } from '@/utils/diagnostics/systemDiagnostics';

export const SystemDiagnosticsPanel = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [running, setRunning] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    try {
      const health = await SystemDiagnostics.runComprehensiveDiagnostics();
      setSystemHealth(health);
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'memory':
        return <Cpu className="w-4 h-4" />;
      case 'performance':
      case 'api performance':
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getOverallBadge = (status: SystemHealth['overallStatus']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500/20 text-green-400">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400">Critical</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">System Diagnostics</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive system health monitoring and diagnostic tools
          </p>
        </div>
        <Button
          onClick={runDiagnostics}
          disabled={running}
          className="cyber-button"
        >
          {running ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Activity className="w-4 h-4 mr-2" />
          )}
          Run Diagnostics
        </Button>
      </div>

      {/* Overall System Health */}
      {systemHealth && (
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health Overview</span>
              {getOverallBadge(systemHealth.overallStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Progress value={systemHealth.score} className="h-2" />
                </div>
                <span className={`font-medium ${getScoreColor(systemHealth.score)}`}>
                  {systemHealth.score}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {systemHealth.results.filter(r => r.status === 'healthy').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">
                    {systemHealth.results.filter(r => r.status === 'warning').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">
                    {systemHealth.results.filter(r => r.status === 'error').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic Results */}
      {systemHealth && (
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemHealth.results.map((result, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(result.category)}
                      <span className="font-medium">{result.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className={`text-sm ${getStatusColor(result.status)}`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                  
                  {result.details && (
                    <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                      <pre>{JSON.stringify(result.details, null, 2)}</pre>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.timestamp.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {systemHealth && systemHealth.recommendations.length > 0 && (
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemHealth.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-blue-500/10 rounded border border-blue-500/20">
                  <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-400">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!systemHealth && !running && (
        <Card className="gradient-border">
          <CardContent className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready for Diagnostics</h3>
            <p className="text-muted-foreground mb-4">
              Run comprehensive system diagnostics to check health and performance
            </p>
            <Button onClick={runDiagnostics} className="cyber-button">
              <Activity className="w-4 h-4 mr-2" />
              Start Diagnostics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
