import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye, Zap } from 'lucide-react';
import { useComplianceViolations, type ComplianceViolation } from '@/hooks/compliance/useComplianceViolations';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { toast } from 'sonner';

interface ComplianceViolationsListProps {
  violations: ComplianceViolation[];
  isLoading: boolean;
  uploadId?: string;
}

export const ComplianceViolationsList: React.FC<ComplianceViolationsListProps> = ({
  violations,
  isLoading,
  uploadId,
}) => {
  const { updateViolationStatus } = useComplianceViolations(uploadId);
  const { generateResponse, loading: aiLoading } = useGeminiAI();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'major':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'minor':
        return <Clock className="w-4 h-4 text-primary" />;
      case 'warning':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 text-red-300 border-red-700';
      case 'major':
        return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'minor':
        return 'bg-primary/20 text-primary border-primary';
      case 'warning':
        return 'bg-green-900 text-green-300 border-green-700';
      default:
        return 'bg-card text-foreground border-border';
    }
  };

  const handleGenerateAISuggestions = async (violation: ComplianceViolation) => {
    try {
      const prompt = `
        Analyze this building code violation and provide specific remediation suggestions:
        
        Violation: ${violation.description}
        Current Value: ${JSON.stringify(violation.current_value)}
        Required Value: ${JSON.stringify(violation.required_value)}
        Location: ${JSON.stringify(violation.location)}
        
        Please provide:
        1. Immediate actions to resolve the violation
        2. Alternative design solutions
        3. Cost-effective approaches
        4. Timeline considerations
        
        Format your response as actionable bullet points.
      `;

      const response = await generateResponse({
        prompt,
        type: 'technical-consulting',
        maxTokens: 1500
      });

      if (response) {
        toast.success('AI remediation suggestions generated');
        // Here you could update the violation with the AI suggestions
        // For now, we'll just show them in a toast
        console.log('AI Suggestions:', response.result);
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      toast.error('Failed to generate AI suggestions');
    }
  };

  if (isLoading) {
    return (
      <Card className="skeuo-panel">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading violations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (violations.length === 0) {
    return (
      <Card className="skeuo-panel">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600">No Violations Found</h3>
            <p className="text-muted-foreground">Your project complies with all checked building codes.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {violations.map((violation) => (
        <Card key={violation.id} className="skeuo-panel">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getSeverityIcon(violation.severity)}
                  <CardTitle className="text-lg">{violation.violation_type}</CardTitle>
                  <Badge className={getSeverityColor(violation.severity)}>
                    {violation.severity}
                  </Badge>
                  <Badge variant="outline" className="border-primary text-primary">
                    {violation.status}
                  </Badge>
                </div>
                <CardDescription className="text-foreground">
                  {violation.description}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateAISuggestions(violation)}
                  disabled={aiLoading}
                  className="border-primary text-primary hover:bg-primary/20"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  AI Suggestions
                </Button>
                {violation.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => updateViolationStatus({ violationId: violation.id, status: 'acknowledged' })}
                    className="skeuo-button"
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-primary mb-2">Current Condition</h4>
                <pre className="text-sm bg-card p-3 rounded border border-border">
                  {JSON.stringify(violation.current_value, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Required Condition</h4>
                <pre className="text-sm bg-card p-3 rounded border border-border">
                  {JSON.stringify(violation.required_value, null, 2)}
                </pre>
              </div>
            </div>
            
            {violation.remediation_suggestions && violation.remediation_suggestions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-primary mb-2">Remediation Suggestions</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                  {violation.remediation_suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground">
              Detected: {new Date(violation.detected_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
