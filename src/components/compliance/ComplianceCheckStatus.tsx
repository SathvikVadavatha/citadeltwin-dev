
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type ComplianceCheck } from '@/hooks/useCompliance';

interface ComplianceCheckStatusProps {
  latestCheck?: ComplianceCheck;
}

export const ComplianceCheckStatus: React.FC<ComplianceCheckStatusProps> = ({ latestCheck }) => {
  if (!latestCheck) return null;

  return (
    <Card className="skeuo-panel">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Last Compliance Check</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant={latestCheck.status === 'completed' ? 'default' : 'destructive'}
                className={latestCheck.status === 'completed' ? 'bg-green-900 text-green-300' : ''}
              >
                {latestCheck.status}
              </Badge>
              <span className="text-sm text-foreground">
                {new Date(latestCheck.started_at).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Rules Checked: {latestCheck.rules_checked}</p>
            <p className="text-sm text-muted-foreground">Violations Found: {latestCheck.violations_found}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
