
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { ComplianceViolation } from '@/hooks/compliance/useComplianceViolations';

interface ComplianceStatsCardsProps {
  violations: ComplianceViolation[];
}

export const ComplianceStatsCards: React.FC<ComplianceStatsCardsProps> = ({ violations }) => {
  const stats = {
    total: violations.length,
    critical: violations.filter(v => v.severity === 'critical').length,
    major: violations.filter(v => v.severity === 'major').length,
    minor: violations.filter(v => v.severity === 'minor').length,
    warning: violations.filter(v => v.severity === 'warning').length,
  };
  
  const complianceScore = Math.max(0, 100 - (stats.critical * 15 + stats.major * 8 + stats.minor * 3 + stats.warning * 1));

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <Card className="skeuo-panel md:col-span-2">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {complianceScore}%
            </div>
            <p className="text-sm text-muted-foreground">Comprehensive Compliance Score</p>
            <div className="mt-2 space-y-1">
              {complianceScore >= 95 ? (
                <Badge className="bg-green-900 text-green-300">Excellent</Badge>
              ) : complianceScore >= 85 ? (
                <Badge className="bg-blue-900 text-blue-300">Very Good</Badge>
              ) : complianceScore >= 70 ? (
                <Badge className="bg-yellow-900 text-yellow-300">Good</Badge>
              ) : (
                <Badge className="bg-red-900 text-red-300">Needs Improvement</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="skeuo-panel">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
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
            <Settings className="w-5 h-5 text-primary" />
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
