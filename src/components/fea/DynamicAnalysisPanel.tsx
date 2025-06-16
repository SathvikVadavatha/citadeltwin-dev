
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap } from 'lucide-react';

interface DynamicAnalysisPanelProps {
  selectedAnalysisId: string;
  onAnalysisSelect: (id: string) => void;
}

export const DynamicAnalysisPanel: React.FC<DynamicAnalysisPanelProps> = ({
  selectedAnalysisId,
  onAnalysisSelect
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Dynamic Analysis Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Dynamic analysis panel</p>
          <p className="text-sm text-muted-foreground">Configure time-history and transient analysis</p>
        </div>
      </CardContent>
    </Card>
  );
};
