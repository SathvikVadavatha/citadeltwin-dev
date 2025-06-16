
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Play, RotateCcw } from 'lucide-react';
import { CalculationTester, TestSuite, TestResult } from '@/utils/testing/calculationTests';

export const CalculationTestRunner = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [running, setRunning] = useState(false);

  const runAllTests = async () => {
    setRunning(true);
    try {
      const results = CalculationTester.runAllTests();
      setTestSuites(results);
    } finally {
      setRunning(false);
    }
  };

  const getOverallScore = () => {
    if (testSuites.length === 0) return 0;
    return Math.round(testSuites.reduce((sum, suite) => sum + suite.score, 0) / testSuites.length);
  };

  const getTotalTests = () => {
    return testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  };

  const getTotalPassed = () => {
    return testSuites.reduce((sum, suite) => sum + suite.passed, 0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (passed: boolean) => {
    return passed ? (
      <Badge className="bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        Passed
      </Badge>
    ) : (
      <Badge className="bg-red-500/20 text-red-400">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Calculation Test Runner</h3>
          <p className="text-sm text-muted-foreground">
            Automated testing for quantity calculations and cost computations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setTestSuites([])}
            disabled={running || testSuites.length === 0}
            className="cyber-button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            onClick={runAllTests}
            disabled={running}
            className="cyber-button"
          >
            {running ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run Tests
          </Button>
        </div>
      </div>

      {/* Overall Test Results */}
      {testSuites.length > 0 && (
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle>Overall Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Progress value={getOverallScore()} className="h-2" />
                </div>
                <span className={`font-medium ${getScoreColor(getOverallScore())}`}>
                  {getOverallScore()}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">{getTotalPassed()}</p>
                  <p className="text-sm text-muted-foreground">Tests Passed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{getTotalTests() - getTotalPassed()}</p>
                  <p className="text-sm text-muted-foreground">Tests Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{getTotalTests()}</p>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Suites */}
      {testSuites.map((suite, suiteIndex) => (
        <Card key={suiteIndex} className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{suite.suiteName}</span>
              <div className="flex items-center space-x-2">
                <Badge className={suite.score >= 90 ? 'bg-green-500/20 text-green-400' : 
                                 suite.score >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 
                                 'bg-red-500/20 text-red-400'}>
                  {suite.score.toFixed(0)}%
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {suite.passed}/{suite.tests.length}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suite.tests.map((test, testIndex) => (
                <div key={testIndex} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{test.testName}</span>
                    {getStatusBadge(test.passed)}
                  </div>
                  
                  <p className={`text-sm ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {test.message}
                  </p>
                  
                  {!test.passed && (test.expected !== undefined || test.actual !== undefined) && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      {test.expected !== undefined && (
                        <div>Expected: {JSON.stringify(test.expected)}</div>
                      )}
                      {test.actual !== undefined && (
                        <div>Actual: {JSON.stringify(test.actual)}</div>
                      )}
                      {test.tolerance && (
                        <div>Tolerance: ±{test.tolerance}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {testSuites.length === 0 && !running && (
        <Card className="gradient-border">
          <CardContent className="text-center py-8">
            <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Test</h3>
            <p className="text-muted-foreground mb-4">
              Run automated tests to validate calculation accuracy and reliability
            </p>
            <Button onClick={runAllTests} className="cyber-button">
              <Play className="w-4 h-4 mr-2" />
              Start Testing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
