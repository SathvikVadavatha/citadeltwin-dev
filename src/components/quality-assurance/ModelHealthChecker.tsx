
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Activity, RefreshCw } from 'lucide-react';
import { ModelValidator, ValidationResult } from '@/utils/validation/modelValidation';
import { useBIMElements } from '@/hooks/useBIMElements';

export const ModelHealthChecker = () => {
  const { elements, loading } = useBIMElements();
  const [healthResults, setHealthResults] = useState<ValidationResult[]>([]);
  const [checking, setChecking] = useState(false);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      const results = elements.map(element => ModelValidator.validateBIMElement(element));
      setHealthResults(results);
    } finally {
      setChecking(false);
    }
  };

  const getOverallHealth = () => {
    if (healthResults.length === 0) return { score: 0, status: 'unknown' };
    
    const averageScore = healthResults.reduce((sum, result) => sum + result.score, 0) / healthResults.length;
    let status = 'excellent';
    
    if (averageScore < 60) status = 'poor';
    else if (averageScore < 80) status = 'fair';
    else if (averageScore < 95) status = 'good';
    
    return { score: Math.round(averageScore), status };
  };

  const getStatusColor = (score: number) => {
    if (score >= 95) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 95) return <Badge className="bg-green-500/20 text-green-600">Excellent</Badge>;
    if (score >= 80) return <Badge className="bg-blue-500/20 text-blue-600">Good</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500/20 text-yellow-600">Fair</Badge>;
    return <Badge className="bg-red-500/20 text-destructive">Poor</Badge>;
  };

  const overallHealth = getOverallHealth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Model Health Check</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive validation of BIM elements and model integrity
          </p>
        </div>
        <Button
          onClick={runHealthCheck}
          disabled={checking || loading || elements.length === 0}
          className="skeuo-button"
        >
          {checking ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Activity className="w-4 h-4 mr-2" />
          )}
          Run Health Check
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Model Health</span>
            {getStatusBadge(overallHealth.score)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Progress value={overallHealth.score} className="h-2" />
              </div>
              <span className={`font-medium ${getStatusColor(overallHealth.score)}`}>
                {overallHealth.score}%
              </span>
            </div>
            
            {healthResults.length > 0 && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {healthResults.filter(r => r.isValid).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Valid Elements</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">
                    {healthResults.filter(r => !r.isValid).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Invalid Elements</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">
                    {healthResults.reduce((sum, r) => sum + r.warnings.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Warnings</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Element-by-Element Results */}
      {healthResults.length > 0 && (
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle>Element Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthResults.map((result, index) => {
                const element = elements[index];
                return (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {result.isValid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">{element.name}</span>
                        <Badge variant="outline">{element.element_type}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(result.score)}
                        <span className={`text-sm ${getStatusColor(result.score)}`}>
                          {result.score}%
                        </span>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-red-500 mb-1">Errors:</h4>
                        <ul className="space-y-1">
                          {result.errors.map((error, errorIndex) => (
                            <li key={errorIndex} className="flex items-start space-x-2 text-sm">
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-destructive">{error.message}</span>
                                {error.suggestion && (
                                  <p className="text-muted-foreground mt-1">{error.suggestion}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.warnings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-500 mb-1">Warnings:</h4>
                        <ul className="space-y-1">
                          {result.warnings.map((warning, warningIndex) => (
                            <li key={warningIndex} className="flex items-start space-x-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-yellow-600">{warning.message}</span>
                                <p className="text-muted-foreground mt-1">{warning.suggestion}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {elements.length === 0 && !loading && (
        <Card className="gradient-border">
          <CardContent className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Elements Found</h3>
            <p className="text-muted-foreground">
              Upload and parse a blueprint to begin model health checking
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
