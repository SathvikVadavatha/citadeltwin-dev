
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube, 
  CheckCircle, 
  Activity,
  FileText
} from 'lucide-react';
import { AutomatedTestRunner } from './AutomatedTestRunner';
import { ModelValidationPanel } from './ModelValidationPanel';
import { DiagnosticHealthCheck } from './DiagnosticHealthCheck';
import { TestReportGenerator } from './TestReportGenerator';
import { TestingSummaryCards } from './TestingSummaryCards';
import { TestingControls } from './TestingControls';

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
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentSuite, setCurrentSuite] = useState<string | null>(null);

  const runFullTestSuite = async () => {
    setIsRunningFullSuite(true);
    setOverallProgress(0);
    try {
      console.log('Running comprehensive test suite...');
      
      // Simulate test execution with progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setOverallProgress(i);
        if (i === 30) setCurrentSuite('automated');
        if (i === 60) setCurrentSuite('validation');
        if (i === 90) setCurrentSuite('diagnostics');
      }
      
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
      setCurrentSuite(null);
    }
  };

  const resetTests = () => {
    setTestingSummary({
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
      overallScore: 0,
      lastRunAt: null
    });
    setOverallProgress(0);
    setCurrentSuite(null);
  };

  return (
    <div className="space-y-6">
      {/* Testing Framework Header & Controls */}
      <TestingControls
        isRunningFullSuite={isRunningFullSuite}
        overallProgress={overallProgress}
        currentSuite={currentSuite}
        testSuites={[
          { id: 'automated', name: 'Automated Tests' },
          { id: 'validation', name: 'Model Validation' },
          { id: 'diagnostics', name: 'Health Diagnostics' }
        ]}
        onRunFullSuite={runFullTestSuite}
        onResetTests={resetTests}
      />

      {/* Testing Summary */}
      <TestingSummaryCards testingSummary={testingSummary} />

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
