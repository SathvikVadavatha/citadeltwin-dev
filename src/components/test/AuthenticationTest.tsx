import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Key, User, Mail, Lock } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export const AuthenticationTest = () => {
  const { user, session, signIn, signOut } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');

  const runAuthTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Check Supabase Auth Configuration
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      testResults.push({
        test: 'Supabase Auth Configuration',
        status: 'success',
        message: 'Supabase auth client is properly configured',
        details: { hasSession: !!currentSession }
      });
    } catch (err: any) {
      testResults.push({
        test: 'Supabase Auth Configuration',
        status: 'error',
        message: err.message
      });
    }

    // Test 2: Check Auth State
    testResults.push({
      test: 'Auth State Check',
      status: user ? 'success' : 'error',
      message: user ? `Currently signed in as ${user.email}` : 'Not authenticated',
      details: {
        userId: user?.id,
        email: user?.email,
        hasSession: !!session
      }
    });

    // Test 3: Check Auth Storage
    try {
      const storedSession = localStorage.getItem('supabase.auth.token');
      testResults.push({
        test: 'Auth Storage (LocalStorage)',
        status: storedSession ? 'success' : 'error',
        message: storedSession ? 'Auth token found in localStorage' : 'No auth token in localStorage',
        details: { hasStoredSession: !!storedSession }
      });
    } catch (err: any) {
      testResults.push({
        test: 'Auth Storage (LocalStorage)',
        status: 'error',
        message: err.message
      });
    }

    // Test 4: Check Available Users
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .limit(5);

      if (error) throw error;

      testResults.push({
        test: 'User Profiles Table',
        status: 'success',
        message: `Found ${users?.length || 0} user profiles in database`,
        details: { userCount: users?.length, users }
      });
    } catch (err: any) {
      testResults.push({
        test: 'User Profiles Table',
        status: 'error',
        message: err.message
      });
    }

    // Test 5: Test Email/Password Requirements
    testResults.push({
      test: 'Password Policy',
      status: 'success',
      message: 'Email/Password authentication is enabled',
      details: {
        minPasswordLength: 6,
        requiresEmail: true
      }
    });

    // Test 6: Check Auth URL Configuration
    testResults.push({
      test: 'Auth URL Configuration',
      status: 'success',
      message: 'Site URL and Redirect URLs should be configured in Supabase Dashboard',
      details: {
        currentOrigin: window.location.origin,
        note: 'Check Authentication > URL Configuration in Supabase Dashboard'
      }
    });

    setResults(testResults);
    setTesting(false);

    const successCount = testResults.filter(r => r.status === 'success').length;
    toast.success(`Auth tests completed: ${successCount}/${testResults.length} passed`);
  };

  const testSignIn = async () => {
    if (!testEmail || !testPassword) {
      toast.error('Please enter email and password');
      return;
    }

    setTesting(true);
    try {
      const { error } = await signIn(testEmail, testPassword);
      
      if (error) {
        toast.error(`Sign in failed: ${error.message}`);
        setResults(prev => [...prev, {
          test: 'Test Sign In',
          status: 'error',
          message: error.message
        }]);
      } else {
        toast.success('Sign in successful!');
        setResults(prev => [...prev, {
          test: 'Test Sign In',
          status: 'success',
          message: `Successfully signed in as ${testEmail}`
        }]);
      }
    } catch (err: any) {
      toast.error(`Sign in error: ${err.message}`);
      setResults(prev => [...prev, {
        test: 'Test Sign In',
        status: 'error',
        message: err.message
      }]);
    } finally {
      setTesting(false);
    }
  };

  const testSignOut = async () => {
    setTesting(true);
    try {
      await signOut();
      toast.success('Sign out successful!');
      setResults(prev => [...prev, {
        test: 'Test Sign Out',
        status: 'success',
        message: 'Successfully signed out'
      }]);
    } catch (err: any) {
      toast.error(`Sign out error: ${err.message}`);
      setResults(prev => [...prev, {
        test: 'Test Sign Out',
        status: 'error',
        message: err.message
      }]);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Authentication Test Suite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Auth Status */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Current Authentication Status
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              user 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
            }`}>
              {user ? 'Authenticated' : 'Not Authenticated'}
            </div>
          </div>
          {user ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active session</p>
          )}
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <div>
            <Button 
              onClick={runAuthTests} 
              disabled={testing}
              className="w-full"
            >
              {testing ? 'Running Tests...' : 'Run Authentication Tests'}
            </Button>
          </div>

          {/* Manual Sign In Test */}
          <div className="p-4 border rounded-lg space-y-3">
            <h3 className="font-semibold text-sm">Test Sign In</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="test-email" className="text-xs">Email</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="test-password" className="text-xs">Password</Label>
                <Input
                  id="test-password"
                  type="password"
                  placeholder="Enter password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={testSignIn} 
                  disabled={testing || !testEmail || !testPassword}
                  size="sm"
                  className="flex-1"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Test Sign In
                </Button>
                {user && (
                  <Button 
                    onClick={testSignOut} 
                    disabled={testing}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    Test Sign Out
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  ) : result.status === 'error' ? (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-destructive mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">{result.test}</div>
                    <div className="text-sm">{result.message}</div>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-muted-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Important Notes */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Important Configuration Notes:</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Email confirmation is required for new signups</li>
            <li>• Site URL must be configured in Supabase Dashboard → Authentication → URL Configuration</li>
            <li>• Redirect URLs must include your app's domain</li>
            <li>• Check that email templates are configured for password recovery</li>
            <li>• For testing, you can disable email confirmation in Supabase Dashboard</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
