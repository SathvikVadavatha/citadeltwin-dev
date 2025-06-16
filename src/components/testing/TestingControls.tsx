
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  RefreshCw, 
  TestTube
} from 'lucide-react';

interface TestingControlsProps {
  isRunningFullSuite: boolean;
  overallProgress: number;
  currentSuite: string | null;
  testSuites: any[];
  onRunFullSuite: () => void;
  onResetTests: () => void;
}

export const TestingControls: React.FC<TestingControlsProps> = ({
  isRunningFullSuite,
  overallProgress,
  currentSuite,
  testSuites,
  onRunFullSuite,
  onResetTests,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TestTube className="h-6 w-6 text-blue-500" />
            Comprehensive Testing Framework
          </span>
          <div className="flex gap-2">
            <Button 
              onClick={onRunFullSuite}
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isRunningFullSuite && (
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
  );
};
