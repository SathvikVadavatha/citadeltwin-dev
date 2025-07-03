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
  enhancedAnalyzing: boolean;
  generating3D: boolean;
  processingMethod?: 'ai' | 'fallback' | null;
  errorMessage?: string;
  onRetry?: () => void;
}

export const ProcessingStatusPanel: React.FC<ProcessingStatusPanelProps> = ({
  uploading,
  processing,
  enhancedAnalyzing,
  generating3D,
  processingMethod,
  errorMessage,
  onRetry
}) => {
  const getStepStatus = (stepActive: boolean, stepCompleted: boolean, hasError: boolean = false) => {
    if (hasError) return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' };
    if (stepActive) return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    if (stepCompleted) return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' };
    return { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-50' };
  };

  const uploadCompleted = !uploading && (processing || enhancedAnalyzing || generating3D || !!processingMethod);
  const processingCompleted = !processing && (enhancedAnalyzing || generating3D || !!processingMethod);
  const analysisCompleted = !enhancedAnalyzing && (generating3D || !!processingMethod);
  const generationCompleted = !generating3D && !!processingMethod;

  const uploadStatus = getStepStatus(uploading, uploadCompleted);
  const processStatus = getStepStatus(processing, processingCompleted, !!errorMessage && processingMethod === 'fallback');
  const analysisStatus = getStepStatus(enhancedAnalyzing, analysisCompleted);
  const generationStatus = getStepStatus(generating3D, generationCompleted);

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

          {/* Step 2: AI Processing */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${processStatus.bgColor}`}>
            <processStatus.icon className={`h-5 w-5 ${processStatus.color}`} />
            <div className="flex-1">
              <h4 className="font-medium">AI Blueprint Analysis</h4>
              <p className="text-sm text-muted-foreground">
                {processing 
                  ? 'Analyzing blueprint with Gemini AI vision...' 
                  : processingMethod === 'ai'
                    ? 'Gemini AI analysis completed successfully'
                    : processingMethod === 'fallback'
                      ? 'Using enhanced sample data (Gemini AI unavailable)'
                      : 'Waiting for upload completion'
                }
              </p>
            </div>
            {errorMessage && processingMethod === 'fallback' && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>

          {/* Step 3: Enhanced Analysis */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${analysisStatus.bgColor}`}>
            <analysisStatus.icon className={`h-5 w-5 ${analysisStatus.color}`} />
            <div className="flex-1">
              <h4 className="font-medium">Enhanced Analysis</h4>
              <p className="text-sm text-muted-foreground">
                {enhancedAnalyzing 
                  ? 'Performing deep structural analysis...' 
                  : analysisCompleted
                    ? 'Enhanced analysis completed'
                    : 'Waiting for AI processing'
                }
              </p>
            </div>
          </div>

          {/* Step 4: 3D Generation */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${generationStatus.bgColor}`}>
            <generationStatus.icon className={`h-5 w-5 ${generationStatus.color}`} />
            <div className="flex-1">
              <h4 className="font-medium">3D Model Generation</h4>
              <p className="text-sm text-muted-foreground">
                {generating3D 
                  ? 'Creating unique 3D architectural model...' 
                  : generationCompleted
                    ? 'Unique 3D model generated successfully'
                    : 'Waiting for analysis completion'
                }
              </p>
            </div>
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
        {processingMethod && !uploading && !processing && !enhancedAnalyzing && !generating3D && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Processing Complete!</strong> Your blueprint has been successfully analyzed and a unique 3D model has been generated using {processingMethod === 'ai' ? 'Gemini AI' : 'enhanced sample data'}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};