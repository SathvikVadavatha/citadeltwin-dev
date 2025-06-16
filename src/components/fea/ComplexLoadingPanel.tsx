
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface ComplexLoadingPanelProps {
  analysisId: string;
}

export const ComplexLoadingPanel: React.FC<ComplexLoadingPanelProps> = ({
  analysisId
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-500" />
          Complex Loading Scenarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Complex loading configuration</p>
          <p className="text-sm text-muted-foreground">Time-varying and distributed loads</p>
        </div>
      </CardContent>
    </Card>
  );
};
