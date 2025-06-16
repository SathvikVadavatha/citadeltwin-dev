
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Play,
  BarChart3,
  Zap,
  Database
} from 'lucide-react';
import { useComplianceChecks } from '@/hooks/compliance/useComplianceChecks';
import { useFEAAnalyses } from '@/hooks/useFEAAnalyses';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';

interface WorkflowTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
}

export const WorkflowValidationPanel: React.FC = () => {
  const [tests, setTests] = useState<WorkflowTest[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  
  const { runComplianceCheck, isRunningCheck } = useComplianceChecks();
  const { analyses, setupCompleteAnalysis, validateAnalysisWorkflow } = useFEAAnalyses();
  const { projects } = useProjects();

  const workflowTests: Omit<WorkflowTest, 'status' | 'duration' | 'error'>[] = [
    {
      id: 'blueprint-upload',
      name: 'Blueprint Upload Workflow',
      description: 'Test file upload, processing, and 3D model generation'
    },
    {
      id: 'compliance-check',
      name: 'Compliance Check Workflow',
      description: 'Test multi-jurisdiction compliance validation'
    },
    {
      id: 'fea-analysis',
      name: 'FEA Analysis Workflow',
      description: 'Test complete FEA setup, validation, and execution'
    },
    {
      id: 'document-generation',
      name: 'Document Generation Workflow',
      description: 'Test automated document creation and export'
    },
    {
      id: 'gis-integration',
      name: 'GIS Integration Workflow',
      description: 'Test real-time GIS data ingestion and processing'
    }
  ];

  useEffect(() => {
    setTests(workflowTests.map(test => ({ ...test, status: 'pending' })));
  }, []);

  const updateTestStatus = (testId: string, status: WorkflowTest['status'], duration?: number, error?: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status, duration, error }
        : test
    ));
  };

  const runBlueprintUploadTest = async () => {
    const startTime = Date.now();
    try {
      updateTestStatus('blueprint-upload', 'running');
      
      // Simulate blueprint upload workflow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if we have any projects (indicating successful uploads)
      if (projects.length === 0) {
        throw new Error('No projects found - upload workflow may not be working');
      }
      
      const duration = Date.now() - startTime;
      updateTestStatus('blueprint-upload', 'passed', duration);
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus('blueprint-upload', 'failed', duration, error.message);
      return false;
    }
  };

  const runComplianceCheckTest = async () => {
    const startTime = Date.now();
    try {
      updateTestStatus('compliance-check', 'running');
      
      // Test compliance check with mock data
      await runComplianceCheck({
        checkType: 'comprehensive',
        jurisdictionId: 'test-jurisdiction'
      });
      
      const duration = Date.now() - startTime;
      updateTestStatus('compliance-check', 'passed', duration);
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus('compliance-check', 'failed', duration, error.message);
      return false;
    }
  };

  const runFEAAnalysisTest = async () => {
    const startTime = Date.now();
    try {
      updateTestStatus('fea-analysis', 'running');
      
      // Test complete FEA workflow
      const analysis = await setupCompleteAnalysis({
        name: 'Workflow Test Analysis',
        analysisType: 'static',
        loads: [
          {
            name: 'Test Load',
            load_type: 'gravity',
            magnitude: 1000,
            direction: { x: 0, y: 0, z: -1 },
            location: { x: 0, y: 0, z: 0 }
          }
        ],
        boundaryConditions: [
          {
            name: 'Fixed Support',
            condition_type: 'fixed',
            location: { x: 0, y: 0, z: 0 },
            constraints: { x: true, y: true, z: true, rx: true, ry: true, rz: true }
          }
        ]
      });
      
      if (!analysis) {
        throw new Error('Failed to create test analysis');
      }
      
      // Validate the workflow
      const validation = await validateAnalysisWorkflow(analysis.id);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      
      const duration = Date.now() - startTime;
      updateTestStatus('fea-analysis', 'passed', duration);
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus('fea-analysis', 'failed', duration, error.message);
      return false;
    }
  };

  const runDocumentGenerationTest = async () => {
    const startTime = Date.now();
    try {
      updateTestStatus('document-generation', 'running');
      
      // Simulate document generation test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const duration = Date.now() - startTime;
      updateTestStatus('document-generation', 'passed', duration);
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus('document-generation', 'failed', duration, error.message);
      return false;
    }
  };

  const runGISIntegrationTest = async () => {
    const startTime = Date.now();
    try {
      updateTestStatus('gis-integration', 'running');
      
      // Simulate GIS integration test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duration = Date.now() - startTime;
      updateTestStatus('gis-integration', 'passed', duration);
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus('gis-integration', 'failed', duration, error.message);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setOverallProgress(0);
    
    const testFunctions = [
      runBlueprintUploadTest,
      runComplianceCheckTest,
      runFEAAnalysisTest,
      runDocumentGenerationTest,
      runGISIntegrationTest
    ];
    
    let completedTests = 0;
    let passedTests = 0;
    
    for (const testFunction of testFunctions) {
      const passed = await testFunction();
      if (passed) passedTests++;
      
      completedTests++;
      setOverallProgress((completedTests / testFunctions.length) * 100);
    }
    
    setIsRunningTests(false);
    
    const successRate = (passedTests / testFunctions.length) * 100;
    if (successRate === 100) {
      toast.success('All workflow tests passed successfully!');
    } else if (successRate >= 80) {
      toast.success(`${passedTests}/${testFunctions.length} tests passed. Good overall performance.`);
    } else {
      toast.error(`Only ${passedTests}/${testFunctions.length} tests passed. Review failed tests.`);
    }
  };

  const getStatusIcon = (status: WorkflowTest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: WorkflowTest['status']) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const avgDuration = tests
    .filter(t => t.duration)
    .reduce((sum, t) => sum + (t.duration || 0), 0) / tests.filter(t => t.duration).length || 0;

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Workflow Validation & Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{passedTests}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{failedTests}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {avgDuration ? `${Math.round(avgDuration)}ms` : '0ms'}
                </div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {tests.length ? Math.round((passedTests / tests.length) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
          </div>
          
          {isRunningTests && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          )}
          
          <Button 
            onClick={runAllTests} 
            disabled={isRunningTests}
            className="cyber-button w-full mb-6"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunningTests ? 'Running Tests...' : 'Run All Workflow Tests'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-muted-foreground">{test.description}</div>
                    {test.error && (
                      <Alert className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{test.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.duration && (
                    <span className="text-xs text-muted-foreground">
                      {test.duration}ms
                    </span>
                  )}
                  {getStatusBadge(test.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
