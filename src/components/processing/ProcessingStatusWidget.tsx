
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRealTimeProcessing } from '@/hooks/useRealTimeProcessing';
import { 
  FileText, 
  Shield, 
  Calculator, 
  FileCheck, 
  Map, 
  X,
  Activity 
} from 'lucide-react';

export const ProcessingStatusWidget: React.FC = () => {
  const { 
    processingStatuses, 
    clearProcessingStatus, 
    clearAllProcessingStatuses 
  } = useRealTimeProcessing();

  if (processingStatuses.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'blueprint': return <FileText className="h-4 w-4" />;
      case 'compliance': return <Shield className="h-4 w-4" />;
      case 'fea': return <Calculator className="h-4 w-4" />;
      case 'document': return <FileCheck className="h-4 w-4" />;
      case 'gis': return <Map className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': case 'error': return 'destructive';
      case 'running': case 'generating': case 'processing': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-hidden shadow-lg z-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllProcessingStatuses}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {processingStatuses.map((status) => (
          <div
            key={`${status.type}-${status.id}`}
            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
          >
            <div className="flex items-center space-x-2 flex-1">
              {getIcon(status.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {status.message}
                </p>
                {status.progress !== undefined && (
                  <Progress value={status.progress} className="h-1 mt-1" />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Badge 
                variant={getStatusColor(status.status)}
                className="text-xs"
              >
                {status.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearProcessingStatus(status.type, status.id)}
                className="h-4 w-4 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
