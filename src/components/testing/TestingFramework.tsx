
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Activity
} from 'lucide-react';
import { AutomatedTestRunner } from './AutomatedTestRunner';
import { ModelValidationPanel } from './ModelValidationPanel';
import { DiagnosticHealthCheck } from './DiagnosticHealthCheck';
import { TestReportGenerator } from './TestReportGenerator';

interface TestingFrameworkProps {
  uploadId?: string;
  projectId?: string;
}

export const TestingFramework: React.FC<TestingFrameworkProps> = ({ uploadId, projectId }) => {
  const [activeTab, setActiveTab] = useState('automated');
  const [testingSummary, setTestingSummary] = useState({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warningTests: 0,
    overallScore: 0,
    lastRunAt: null as Date | null
  });

  const [isRunningFullSuite, setIsRunningFullSuite] = useState(false);

  const runFullTestSuite = async () => {
    setIsRunningFullSuite(true);
    try {
      // This would trigger all testing components to run their tests
      console.log('Running comprehensive test suite...');
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setTestingSummary({
        totalTests: 45,
        passedTests: 38,
        failedTests: 4,
        warningTests: 3,
        overallScore: 84,
        lastRunAt: new Date()
      });
    } catch (error) {
      console.error('Test suite execution failed:', error);
    } finally {
      setIsRunningFullSuite(false);
    }
  };

  const getStatusColor = (type: 'passed' | 'failed' | 'warning' | 'overall') => {
    switch (type) {
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'overall': return testingSummary.overallScore >= 80 ? 'text-green-500' : 
                            testingSummary.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Testing Framework Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="h-6 w-6 text-blue-500" />
            Comprehensive Testing Framework
          </h2>
          <p className="text-muted-foreground">
            Automated testing, model validation, and system diagnostics
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runFullTestSuite}
            disabled={isRunningFullSuite}
            className="flex items-center gap-2"
          >
            {isRunningFullSuite ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Full Test Suite
          </Button>
        </div>
      </div>

      {/* Testing Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TestTube className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="font-medium text-lg">{testingSummary.totalTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-8 h-8 ${getStatusColor('passed')}`} />
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className={`font-medium text-lg ${getStatusColor('passed')}`}>
                  {testingSummary.passedTests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className={`w-8 h-8 ${getStatusColor('failed')}`} />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className={`font-medium text-lg ${getStatusColor('failed')}`}>
                  {testingSummary.failedTests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`w-8 h-8 ${getStatusColor('warning')}`} />
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className={`font-medium text-lg ${getStatusColor('warning')}`}>
                  {testingSummary.warningTests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className={`w-8 h-8 ${getStatusColor('overall')}`} />
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className={`font-medium text-lg ${getStatusColor('overall')}`}>
                  {testingSummary.overallScore}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {testingSummary.totalTests > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Test Progress</span>
                <span>{testingSummary.passedTests}/{testingSummary.totalTests} tests passed</span>
              </div>
              <Progress 
                value={(testingSummary.passedTests / testingSummary.totalTests) * 100} 
                className="h-2"
              />
              {testingSummary.lastRunAt && (
                <p className="text-xs text-muted-foreground">
                  Last run: {testingSummary.lastRunAt.toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="automated" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Automated Tests
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Model Validation
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health Diagnostics
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Test Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automated" className="space-y-4">
          <AutomatedTestRunner 
            uploadId={uploadId}
            projectId={projectId}
            onTestComplete={(results) => {
              setTestingSummary(prev => ({
                ...prev,
                ...results,
                lastRunAt: new Date()
              }));
            }}
          />
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <ModelValidationPanel uploadId={uploadId} />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <DiagnosticHealthCheck />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <TestReportGenerator 
            testingSummary={testingSummary}
            uploadId={uploadId}
            projectId={projectId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
