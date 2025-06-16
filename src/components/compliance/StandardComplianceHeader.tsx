
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw } from 'lucide-react';

interface StandardComplianceHeaderProps {
  uploadId?: string;
  isRunningCheck: boolean;
  onRunComplianceCheck: () => void;
}

export const StandardComplianceHeader: React.FC<StandardComplianceHeaderProps> = ({
  uploadId,
  isRunningCheck,
  onRunComplianceCheck
}) => {
  return (
    <Card className="cyber-tool-palette">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-cyan-400">Standard Building Code Compliance Engine</CardTitle>
            <CardDescription className="text-gray-300">
              IBC 2021 compliance checking with basic remediation suggestions
            </CardDescription>
          </div>
          <Button
            onClick={onRunComplianceCheck}
            disabled={!uploadId || isRunningCheck}
            className="cyber-button"
          >
            {isRunningCheck ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Check...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Standard Check
              </>
            )}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
