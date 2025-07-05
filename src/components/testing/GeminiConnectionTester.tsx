import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, TestTube } from 'lucide-react';
import { testGeminiConnection, testGeminiVision } from '@/hooks/blueprint/utils/geminiConnectionTest';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const GeminiConnectionTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testingEdgeFunction, setTestingEdgeFunction] = useState(false);
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [visionResult, setVisionResult] = useState<TestResult | null>(null);
  const [edgeFunctionResult, setEdgeFunctionResult] = useState<TestResult | null>(null);

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

  const testEdgeFunction = async () => {
    setTestingEdgeFunction(true);
    setEdgeFunctionResult(null);

    try {
      console.log('🧪 Testing edge function connectivity...');
      
      const { data, error } = await supabase.functions.invoke('gemini-connection-test', {
        body: {}
      });

      if (error) {
        console.error('Edge function test error:', error);
        setEdgeFunctionResult({ 
          success: false, 
          message: `Edge function error: ${error.message}`,
          details: error
        });
      } else {
        console.log('Edge function test result:', data);
        setEdgeFunctionResult({ 
          success: data.success, 
          message: data.message,
          details: data
        });
      }
    } catch (error) {
      console.error('Edge function test error:', error);
      setEdgeFunctionResult({ 
        success: false, 
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    } finally {
      setTestingEdgeFunction(false);
    }
  };

  const runAllTests = async () => {
    await testEdgeFunction();
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
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={testEdgeFunction} 
              disabled={testingEdgeFunction || testing}
              variant="outline"
              size="sm"
            >
              {testingEdgeFunction ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
              Test Edge Function
            </Button>
            
            <Button 
              onClick={runConnectionTest} 
              disabled={testing || testingEdgeFunction}
              variant="outline"
              size="sm"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Connection
            </Button>
            
            <Button 
              onClick={runVisionTest} 
              disabled={testing || testingEdgeFunction}
              variant="outline"  
              size="sm"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Vision
            </Button>
            
            <Button 
              onClick={runAllTests} 
              disabled={testing || testingEdgeFunction}
            >
              {(testing || testingEdgeFunction) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Run All Tests
            </Button>
          </div>

          {/* Edge Function Test Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                {getStatusIcon(edgeFunctionResult)}
                Edge Function Connectivity
              </h3>
              {getStatusBadge(edgeFunctionResult)}
            </div>
            
            {edgeFunctionResult && (
              <Alert variant={edgeFunctionResult.success ? "default" : "destructive"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Message:</strong> {edgeFunctionResult.message}</p>
                    
                    {edgeFunctionResult.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          Technical Details
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(edgeFunctionResult.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    {edgeFunctionResult.details?.suggestion && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Suggestion:</strong> {edgeFunctionResult.details.suggestion}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
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
          {(edgeFunctionResult || connectionResult || visionResult) && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Diagnostic Summary</h4>
              <div className="text-sm space-y-1">
                {!edgeFunctionResult?.success && edgeFunctionResult && (
                  <p className="text-red-600">🚨 Edge function deployment issue - check function logs and API key configuration</p>
                )}
                
                {edgeFunctionResult?.success && connectionResult?.success && visionResult?.success && (
                  <p className="text-green-600">✅ Gemini AI is fully operational and ready for blueprint processing</p>
                )}
                
                {edgeFunctionResult?.success && connectionResult?.success && !visionResult?.success && (
                  <p className="text-amber-600">⚠️ Basic connection works but vision processing may have issues</p>
                )}
                
                {edgeFunctionResult?.success && !connectionResult?.success && (
                  <p className="text-red-600">❌ Gemini AI connection failed - blueprint processing will use fallback mode</p>
                )}
                
                {!edgeFunctionResult && !connectionResult?.success && (
                  <p className="text-red-600">❌ Gemini AI connection failed - blueprint processing will use fallback mode</p>
                )}
                
                <p className="text-muted-foreground mt-2">
                  Check the console logs and technical details above for more information.
                </p>
                
                {!edgeFunctionResult?.success && edgeFunctionResult && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-4 border-red-500">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Next Steps:</strong> Edge function connectivity is failing. This is likely the root cause of 500 errors. 
                      Check that GEMINI_API_KEY is properly configured in Supabase Edge Function Secrets.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};