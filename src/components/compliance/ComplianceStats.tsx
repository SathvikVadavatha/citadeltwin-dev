
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
      <Card className="cyber-tool-palette">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">Critical</p>
              <p className="text-xl font-bold text-red-400">{stats.critical}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cyber-tool-palette">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">Major</p>
              <p className="text-xl font-bold text-yellow-400">{stats.major}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cyber-tool-palette">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-sm text-gray-400">Minor</p>
              <p className="text-xl font-bold text-cyan-400">{stats.minor}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cyber-tool-palette">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Warnings</p>
              <p className="text-xl font-bold text-green-400">{stats.warning}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
