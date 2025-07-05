import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { testGeminiConnection, testGeminiVision } from '@/hooks/blueprint/utils/geminiConnectionTest';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const GeminiConnectionTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [visionResult, setVisionResult] = useState<TestResult | null>(null);

  const runConnectionTest = async () => {
    setTesting(true);
    setConnectionResult(null);
    
    try {
      console.log('🧪 Starting Gemini AI connection test...');
      const result = await testGeminiConnection();
      console.log('🔍 Connection test result:', result);
      setConnectionResult(result);
    } catch (error) {
      console.error('💥 Connection test failed:', error);
      setConnectionResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    } finally {
      setTesting(false);
    }
  };

  const runVisionTest = async () => {
    setTesting(true);
    setVisionResult(null);
    
    try {
      console.log('🖼️ Starting Gemini AI vision test...');
      const result = await testGeminiVision();
      console.log('🔍 Vision test result:', result);
      setVisionResult(result);
    } catch (error) {
      console.error('💥 Vision test failed:', error);
      setVisionResult({
        success: false,
        message: `Vision test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    } finally {
      setTesting(false);
    }
  };

  const runAllTests = async () => {
    await runConnectionTest();
    if (connectionResult?.success !== false) {
      await runVisionTest();
    }
  };

  const getStatusIcon = (result: TestResult | null) => {
    if (!result) return null;
    
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (result: TestResult | null) => {
    if (!result) return <Badge variant="secondary">Not Tested</Badge>;
    
    if (result.success) {
      return <Badge variant="default" className="bg-green-100 text-green-800">✅ Success</Badge>;
    } else {
      return <Badge variant="destructive">❌ Failed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Gemini AI Connection Tester
          </CardTitle>
          <CardDescription>
            Test the Gemini AI integration to diagnose connection and processing issues.
            This helps identify problems with API keys, network connectivity, and service availability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runConnectionTest} 
              disabled={testing}
              variant="outline"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Connection
            </Button>
            
            <Button 
              onClick={runVisionTest} 
              disabled={testing}
              variant="outline"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Vision
            </Button>
            
            <Button 
              onClick={runAllTests} 
              disabled={testing}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Run All Tests
            </Button>
          </div>

          {/* Connection Test Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                {getStatusIcon(connectionResult)}
                Basic Connection Test
              </h3>
              {getStatusBadge(connectionResult)}
            </div>
            
            {connectionResult && (
              <Alert variant={connectionResult.success ? "default" : "destructive"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Message:</strong> {connectionResult.message}</p>
                    
                    {connectionResult.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          Technical Details
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(connectionResult.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    {connectionResult.details?.suggestion && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Suggestion:</strong> {connectionResult.details.suggestion}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Vision Test Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                {getStatusIcon(visionResult)}
                Image Vision Test
              </h3>
              {getStatusBadge(visionResult)}
            </div>
            
            {visionResult && (
              <Alert variant={visionResult.success ? "default" : "destructive"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Message:</strong> {visionResult.message}</p>
                    
                    {visionResult.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          Technical Details
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(visionResult.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Overall Status */}
          {(connectionResult || visionResult) && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Diagnostic Summary</h4>
              <div className="text-sm space-y-1">
                {connectionResult?.success && visionResult?.success && (
                  <p className="text-green-600">✅ Gemini AI is fully operational and ready for blueprint processing</p>
                )}
                
                {connectionResult?.success && !visionResult?.success && (
                  <p className="text-amber-600">⚠️ Basic connection works but vision processing may have issues</p>
                )}
                
                {!connectionResult?.success && (
                  <p className="text-red-600">❌ Gemini AI connection failed - blueprint processing will use fallback mode</p>
                )}
                
                <p className="text-muted-foreground mt-2">
                  Check the console logs and technical details above for more information.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};