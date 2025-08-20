import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Mail, AlertCircle } from 'lucide-react';
import { useDeliveryLogs } from '@/hooks/useDeliveryLogs';
import { format } from 'date-fns';

interface DeliveryLogsViewerProps {
  onClose: () => void;
}

export const DeliveryLogsViewer: React.FC<DeliveryLogsViewerProps> = ({ onClose }) => {
  const { deliveryLogs, isLoading } = useDeliveryLogs();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'generating':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Mail className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'generating':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Delivery Logs
            </CardTitle>
            <CardDescription>
              Track report generation and delivery status
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : deliveryLogs.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No delivery logs</h3>
            <p className="text-muted-foreground">
              Report deliveries will appear here once scheduled reports start running
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveryLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getStatusColor(log.status)} 
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(log.status)}
                      {log.status}
                    </Badge>
                    <h3 className="font-medium">{log.scheduled_reports.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {log.scheduled_reports.report_type}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Recipients:</span>
                    <div className="font-medium">
                      {log.recipients_sent?.length || 0} sent
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">File Size:</span>
                    <div className="font-medium">
                      {formatFileSize(log.file_size)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Execution Time:</span>
                    <div className="font-medium">
                      {formatExecutionTime(log.execution_time_ms)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Delivered:</span>
                    <div className="font-medium">
                      {log.delivered_at ? format(new Date(log.delivered_at), 'HH:mm') : 'N/A'}
                    </div>
                  </div>
                </div>

                {log.error_message && (
                  <div className="mt-3 p-2 bg-destructive/10 rounded text-sm">
                    <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                      <AlertCircle className="h-4 w-4" />
                      Error
                    </div>
                    <div className="text-destructive/80">{log.error_message}</div>
                  </div>
                )}

                {log.recipients_sent && log.recipients_sent.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground mb-1">Recipients:</div>
                    <div className="flex flex-wrap gap-1">
                      {log.recipients_sent.map((email, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {log.file_path && log.status === 'sent' && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In a real implementation, this would download the file
                        console.log('Download file:', log.file_path);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};