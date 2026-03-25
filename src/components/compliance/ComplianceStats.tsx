
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { type ComplianceViolation } from '@/hooks/useCompliance';

interface ComplianceStatsProps {
  violations: ComplianceViolation[];
}

export const ComplianceStats: React.FC<ComplianceStatsProps> = ({ violations }) => {
  const getViolationStats = () => {
    const stats = {
      critical: violations.filter(v => v.severity === 'critical').length,
      major: violations.filter(v => v.severity === 'major').length,
      minor: violations.filter(v => v.severity === 'minor').length,
      warning: violations.filter(v => v.severity === 'warning').length,
    };
    return stats;
  };

  const stats = getViolationStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="skeuo-panel">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-xl font-bold text-destructive">{stats.critical}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="skeuo-panel">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Major</p>
              <p className="text-xl font-bold text-yellow-600">{stats.major}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="skeuo-panel">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Minor</p>
              <p className="text-xl font-bold text-primary">{stats.minor}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="skeuo-panel">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-xl font-bold text-green-600">{stats.warning}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
