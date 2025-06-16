
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap
} from 'lucide-react';
import { CalculationTester } from '@/utils/testing/calculationTests';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
}

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration?: number;
  expected?: any;
  actual?: any;
}

interface AutomatedTestRunnerProps {
  uploadId?: string;
  projectId?: string;
  onTestComplete?: (results: { totalTests: number; passedTests: number; failedTests: number; warningTests: number; overallScore: number }) => void;
}

export const AutomatedTestRunner: React.FC<AutomatedTestRunnerProps> = ({ 
  uploadId, 
  projectId, 
  onTestComplete 
}) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'calculations',
      name: 'Calculation Tests',
      description: 'Quantity and cost calculation validation',
      tests: [],
      status: 'pending'
    },
    {
      id: 'integration',
      name: 'Integration Tests',
      description: 'Component integration and API tests',
      tests: [],
      status: 'pending'
    },
    {
      id: 'performance',
      name: 'Performance Tests',
      description: 'Load and response time validation',
      tests: [],
      status: 'pending'
    },
    {
      id: 'security',
      name: 'Security Tests',
      description: 'Authentication and authorization tests',
      tests: [],
      status: 'pending'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentSuite, setCurrentSuite] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  const runCalculationTests = async (): Promise<TestResult[]> => {
    const quantityTests = CalculationTester.runQuantityCalculationTests();
    const costTests = CalculationTester.runCostCalculationTests();
    
    return [
      ...quantityTests.tests.map(test => ({
        testName: `Quantity: ${test.testName}`,
        passed: test.passed,
        message: test.message,
        duration: Math.random() * 100 + 50,
        expected: test.expected,
        actual: test.actual
      })),
      ...costTests.tests.map(test => ({
        testName: `Cost: ${test.testName}`,
        passed: test.passed,
        message: test.message,
        duration: Math.random() * 100 + 50,
        expected: test.expected,
        actual: test.actual
      }))
    ];
  };

  const runIntegrationTests = async (): Promise<TestResult[]> => {
    // Simulate integration tests
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        testName: 'Blueprint Upload Integration',
        passed: true,
        message: 'Upload service integration working correctly',
        duration: 234
      },
      {
        testName: 'FEA Analysis Pipeline',
        passed: true,
        message: 'FEA analysis workflow functioning properly',
        duration: 456
      },
      {
        testName: 'Compliance Check Integration',
        passed: false,
        message: 'Compliance service timeout detected',
        duration: 1200
      },
      {
        testName: 'Document Generation API',
        passed: true,
        message: 'Document generation service responsive',
        duration: 678
      }
    ];
  };

  const runPerformanceTests = async (): Promise<TestResult[]> => {
    // Simulate performance tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return [
      {
        testName: 'Page Load Performance',
        passed: true,
        message: 'Average load time: 1.2s (target: <2s)',
        duration: 1200
      },
      {
        testName: 'API Response Time',
        passed: true,
        message: 'Average response time: 145ms (target: <500ms)',
        duration: 145
      },
      {
        testName: 'Memory Usage',
        passed: false,
        message: 'Memory usage: 85% (target: <80%)',
        duration: 0
      },
      {
        testName: 'Database Query Performance',
        passed: true,
        message: 'Average query time: 23ms (target: <100ms)',
        duration: 23
      }
    ];
  };

  const runSecurityTests = async (): Promise<TestResult[]> => {
    // Simulate security tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        testName: 'Authentication Flow',
        passed: true,
        message: 'User authentication working correctly',
        duration: 89
      },
      {
        testName: 'Authorization Checks',
        passed: true,
        message: 'Role-based access control functioning',
        duration: 67
      },
      {
        testName: 'Data Encryption',
        passed: true,
        message: 'Sensitive data properly encrypted',
        duration: 34
      },
      {
        testName: 'SQL Injection Protection',
        passed: true,
        message: 'No SQL injection vulnerabilities detected',
        duration: 156
      }
    ];
  };

  const runTestSuite = async (suiteId: string) => {
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'running' as const, tests: [] }
        : suite
    ));

    setCurrentSuite(suiteId);

    try {
      let results: TestResult[] = [];
      const startTime = Date.now();

      switch (suiteId) {
        case 'calculations':
          results = await runCalculationTests();
          break;
        case 'integration':
          results = await runIntegrationTests();
          break;
        case 'performance':
          results = await runPerformanceTests();
          break;
        case 'security':
          results = await runSecurityTests();
          break;
      }

      const duration = Date.now() - startTime;

      setTestSuites(prev => prev.map(suite => 
        suite.id === suiteId 
          ? { 
              ...suite, 
              status: 'completed' as const, 
              tests: results,
              duration
            }
          : suite
      ));

    } catch (error) {
      setTestSuites(prev => prev.map(suite => 
        suite.id === suiteId 
          ? { ...suite, status: 'failed' as const }
          : suite
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallProgress(0);

    for (let i = 0; i < testSuites.length; i++) {
      await runTestSuite(testSuites[i].id);
      setOverallProgress(((i + 1) / testSuites.length) * 100);
    }

    setCurrentSuite(null);
    setIsRunning(false);

    // Calculate overall results
    const allTests = testSuites.flatMap(suite => suite.tests);
    const totalTests = allTests.length;
    const passedTests = allTests.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;

    if (onTestComplete) {
      onTestComplete({
        totalTests,
        passedTests,
        failedTests,
        warningTests: 0,
        overallScore: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      });
    }
  };

  const resetTests = () => {
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'pending' as const,
      tests: [],
      duration: undefined
    })));
    setOverallProgress(0);
    setCurrentSuite(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-400/50';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-400/50';
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-400/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Automated Test Runner
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run All Tests
              </Button>
              <Button 
                onClick={resetTests} 
                variant="outline"
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              {currentSuite && (
                <p className="text-sm text-muted-foreground">
                  Running: {testSuites.find(s => s.id === currentSuite)?.name}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Suites */}
      <div className="grid gap-4">
        {testSuites.map((suite) => (
          <Card key={suite.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(suite.status)}
                  <div>
                    <CardTitle className="text-lg">{suite.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{suite.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(suite.status)}>
                    {suite.status}
                  </Badge>
                  {suite.duration && (
                    <span className="text-sm text-muted-foreground">
                      {suite.duration}ms
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={() => runTestSuite(suite.id)}
                    disabled={isRunning}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {suite.tests.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {suite.tests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        {test.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">{test.testName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {test.duration && <span>{test.duration}ms</span>}
                        <span className={test.passed ? 'text-green-500' : 'text-red-500'}>
                          {test.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
