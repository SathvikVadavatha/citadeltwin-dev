
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity
} from 'lucide-react';

interface TestingSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  overallScore: number;
  lastRunAt: Date | null;
}

interface TestingSummaryCardsProps {
  testingSummary: TestingSummary;
}

export const TestingSummaryCards: React.FC<TestingSummaryCardsProps> = ({ testingSummary }) => {
  const getStatusColor = (type: 'passed' | 'failed' | 'warning' | 'overall') => {
    switch (type) {
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'overall': return testingSummary.overallScore >= 80 ? 'text-green-500' : 
                            testingSummary.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <>
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
    </>
  );
};
