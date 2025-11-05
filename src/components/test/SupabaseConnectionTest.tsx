import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

interface TestResult {
  test: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export const SupabaseConnectionTest = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Connection
    try {
      const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
      testResults.push({
        test: 'Database Connection',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Connected successfully (${data || 0} projects)`,
        data: { count: data }
      });
    } catch (err: any) {
      testResults.push({
        test: 'Database Connection',
        status: 'error',
        message: err.message
      });
    }

    // Test 2: Auth State
    testResults.push({
      test: 'Authentication',
      status: user ? 'success' : 'error',
      message: user ? `Authenticated as ${user.email}` : 'Not authenticated',
      data: { userId: user?.id }
    });

    // Test 3: GIS Layers (requires auth)
    try {
      const { data, error } = await supabase
        .from('gis_layers')
        .select('id, layer_name, city, state')
        .limit(5);
      testResults.push({
        test: 'GIS Layers Access',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Found ${data?.length || 0} GIS layers`,
        data: data
      });
    } catch (err: any) {
      testResults.push({
        test: 'GIS Layers Access',
        status: 'error',
        message: err.message
      });
    }

    // Test 4: Blueprint Uploads (requires auth)
    try {
      const { data, error } = await supabase
        .from('blueprint_uploads')
        .select('id, filename, upload_status')
        .limit(5);
      testResults.push({
        test: 'Blueprint Uploads Access',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Found ${data?.length || 0} uploads`,
        data: data
      });
    } catch (err: any) {
      testResults.push({
        test: 'Blueprint Uploads Access',
        status: 'error',
        message: err.message
      });
    }

    // Test 5: Profile Access (requires auth)
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role:roles(role_name)')
          .eq('id', user.id)
          .single();
        testResults.push({
          test: 'Profile Access',
          status: error ? 'error' : 'success',
          message: error ? error.message : `Profile loaded: ${data?.full_name || 'N/A'}`,
          data: data
        });
      } catch (err: any) {
        testResults.push({
          test: 'Profile Access',
          status: 'error',
          message: err.message
        });
      }
    }

    // Test 6: Storage Access
    try {
      const { data, error } = await supabase.storage.getBucket('blueprints');
      testResults.push({
        test: 'Storage Access',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Blueprints bucket accessible',
        data: data
      });
    } catch (err: any) {
      testResults.push({
        test: 'Storage Access',
        status: 'error',
        message: err.message
      });
    }

    setResults(testResults);
    setTesting(false);

    const successCount = testResults.filter(r => r.status === 'success').length;
    toast.success(`Tests completed: ${successCount}/${testResults.length} passed`);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Auth Status: {user ? '✅ Authenticated' : '❌ Not Authenticated'}
          </div>
          <Button onClick={runTests} disabled={testing}>
            {testing ? 'Running Tests...' : 'Run Connection Tests'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                    : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {result.status === 'success' ? '✅' : '❌'} {result.test}
                    </div>
                    <div className="text-sm">{result.message}</div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-muted-foreground">
                          View Data
                        </summary>
                        <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!user && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm">
              ⚠️ You are not authenticated. Some tests will fail due to Row Level Security (RLS) policies. 
              Please sign in to test authenticated data access.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
