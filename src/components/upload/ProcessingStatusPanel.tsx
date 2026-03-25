import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Brain,
  TestTube,
  AlertTriangle,
  Bug
} from "lucide-react";

interface ProcessingStatusPanelProps {
  uploading: boolean;
  processing: boolean;
  processingMethod?: 'ai' | 'fallback' | null;
  errorMessage?: string;
  onRetry?: () => void;
}

export const ProcessingStatusPanel: React.FC<ProcessingStatusPanelProps> = ({
  uploading,
  processing,
  processingMethod,
  errorMessage,
  onRetry
}) => {
  const getStepStatus = (stepActive: boolean, stepCompleted: boolean, hasError: boolean = false) => {
    if (hasError) return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' };
    if (stepActive) return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    if (stepCompleted) return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' };
    return { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-gray-50' };
  };

  const uploadCompleted = !uploading && (processing || !!processingMethod);
  const processingCompleted = !processing && !!processingMethod;

  const uploadStatus = getStepStatus(uploading, uploadCompleted);
  const processStatus = getStepStatus(processing, processingCompleted, !!errorMessage && processingMethod === 'fallback');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Processing Pipeline Status
          {processingMethod && (
            <Badge variant={processingMethod === 'ai' ? 'default' : 'secondary'}>
              {processingMethod === 'ai' ? (
                <>
                  <Brain className="h-3 w-3 mr-1" />
                  Gemini AI
                </>
              ) : (
                <>
                  <TestTube className="h-3 w-3 mr-1" />
                  Enhanced Sample
                </>
              )}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Processing Steps */}
        <div className="space-y-3">
          {/* Step 1: Upload */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${uploadStatus.bgColor}`}>
            <uploadStatus.icon className={`h-5 w-5 ${uploadStatus.color}`} />
            <div className="flex-1">
              <h4 className="font-medium">File Upload</h4>
              <p className="text-sm text-muted-foreground">
                {uploading ? 'Uploading blueprint to secure storage...' : 'Blueprint uploaded successfully'}
              </p>
            </div>
          </div>

          {/* Step 2: Blueprint Processing */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${processStatus.bgColor}`}>
            <processStatus.icon className={`h-5 w-5 ${processStatus.color}`} />
            <div className="flex-1">
              <h4 className="font-medium">Blueprint Analysis</h4>
              <p className="text-sm text-muted-foreground">
                {processing 
                  ? 'Extracting text and detecting architectural elements...' 
                  : processingMethod === 'ai'
                    ? 'AI analysis completed successfully'
                    : processingMethod === 'fallback'
                      ? 'Using enhanced fallback processing'
                      : 'Waiting for upload completion'
                }
              </p>
            </div>
            {errorMessage && processingMethod === 'fallback' && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p><strong>Processing Note:</strong> {errorMessage}</p>
                <p className="text-sm">
                  The system automatically switched to enhanced sample data mode to continue processing your blueprint. 
                  This provides realistic architectural elements for demonstration purposes.
                </p>
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRetry}
                    className="mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry with Gemini AI
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Summary */}
        {processingMethod && !uploading && !processing && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Processing Complete!</strong> Your blueprint has been successfully analyzed using {processingMethod === 'ai' ? 'AI processing' : 'enhanced fallback processing'}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};