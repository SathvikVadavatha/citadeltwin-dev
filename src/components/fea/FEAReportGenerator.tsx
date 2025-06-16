
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface FEAReportGeneratorProps {
  analysisId: string;
}

export const FEAReportGenerator: React.FC<FEAReportGeneratorProps> = ({
  analysisId
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-500" />
          Report Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Automated report generation</p>
          <p className="text-sm text-muted-foreground">Professional FEA analysis reports</p>
        </div>
      </CardContent>
    </Card>
  );
};
