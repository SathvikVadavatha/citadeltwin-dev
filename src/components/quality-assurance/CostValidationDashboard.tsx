
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, DollarSign, RefreshCw } from 'lucide-react';
import { CostValidator } from '@/utils/validation/costValidation';
import { ValidationResult } from '@/utils/validation/modelValidation';
import { useCostEstimation } from '@/hooks/useCostEstimation';

interface CostValidationDashboardProps {
  projectId: string;
}

export const CostValidationDashboard = ({ projectId }: CostValidationDashboardProps) => {
  const { estimations, lineItems, currentEstimation, loading } = useCostEstimation(projectId);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [validating, setValidating] = useState(false);

  const runValidation = async () => {
    setValidating(true);
    try {
      const results: Record<string, ValidationResult> = {};
      
      for (const estimation of estimations) {
        // Get line items for this estimation (in real app, this would be filtered)
        const estimationLineItems = lineItems || [];
        const result = CostValidator.validateCostEstimation(estimation, estimationLineItems);
        results[estimation.id] = result;
      }
      
      setValidationResults(results);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    if (estimations.length > 0) {
      runValidation();
    }
  }, [estimations]);

  const getOverallValidationScore = () => {
    const results = Object.values(validationResults);
    if (results.length === 0) return 0;
    return Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length);
  };

  const getTotalErrors = () => {
    return Object.values(validationResults).reduce((sum, result) => 
      sum + result.errors.filter(e => e.type === 'critical' || e.type === 'error').length, 0);
  };

  const getTotalWarnings = () => {
    return Object.values(validationResults).reduce((sum, result) => sum + result.warnings.length, 0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500/20 text-green-400">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500/20 text-yellow-400">Good</Badge>;
    return <Badge className="bg-red-500/20 text-red-400">Needs Review</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cost Validation Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Validate cost estimations for accuracy and completeness
          </p>
        </div>
        <Button
          onClick={runValidation}
          disabled={validating || loading || estimations.length === 0}
          className="cyber-button"
        >
          {validating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Validate All
        </Button>
      </div>

      {/* Overall Validation Summary */}
      {Object.keys(validationResults).length > 0 && (
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall Validation Score</span>
              {getStatusBadge(getOverallValidationScore())}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Progress value={getOverallValidationScore()} className="h-2" />
                </div>
                <span className={`font-medium ${getScoreColor(getOverallValidationScore())}`}>
                  {getOverallValidationScore()}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{Object.keys(validationResults).length}</p>
                  <p className="text-sm text-muted-foreground">Estimations</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{getTotalErrors()}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{getTotalWarnings()}</p>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Estimation Results */}
      {estimations.map((estimation) => {
        const result = validationResults[estimation.id];
        if (!result) return null;

        return (
          <Card key={estimation.id} className="gradient-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>{estimation.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(result.score)}
                  <span className={`text-sm ${getScoreColor(result.score)}`}>
                    {result.score}%
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Progress value={result.score} className="h-2" />
                  </div>
                  <span className={`text-sm ${result.isValid ? 'text-green-500' : 'text-red-500'}`}>
                    {result.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>

                {result.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-500 mb-2">Errors:</h4>
                    <div className="space-y-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-red-400">{error.message}</p>
                            {error.suggestion && (
                              <p className="text-xs text-muted-foreground mt-1">{error.suggestion}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {error.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-yellow-500 mb-2">Warnings:</h4>
                    <div className="space-y-2">
                      {result.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-400">{warning.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{warning.suggestion}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {warning.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.errors.length === 0 && result.warnings.length === 0 && (
                  <div className="flex items-center space-x-2 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">No issues found</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {estimations.length === 0 && !loading && (
        <Card className="gradient-border">
          <CardContent className="text-center py-8">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Cost Estimations</h3>
            <p className="text-muted-foreground">
              Create cost estimations to begin validation analysis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
