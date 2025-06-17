
import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common/LoadingStates';

interface DocumentExport {
  id: string;
  title: string;
  document_type: string;
  format_type: string;
  status: string;
  error_message?: string;
  template_id?: string;
}

interface DocumentExportsListProps {
  exports: DocumentExport[];
  isLoading: boolean;
  error: any;
  onDownload: (exportId: string) => void;
  onRetry?: (exportItem: DocumentExport) => void;
}

export const DocumentExportsList: React.FC<DocumentExportsListProps> = ({
  exports,
  isLoading,
  error,
  onDownload,
  onRetry
}) => {
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const handleRetry = useCallback((exportItem: DocumentExport) => {
    if (onRetry) {
      onRetry(exportItem);
    }
  }, [onRetry]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Documents</CardTitle>
        <CardDescription>
          View and download your generated documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner text="Loading document history..." />
        ) : error ? (
          <ErrorState
            title="Failed to Load Documents"
            message="Unable to fetch your document history. Please try refreshing the page."
            onRetry={() => window.location.reload()}
          />
        ) : exports.length === 0 ? (
          <EmptyState
            title="No documents generated yet"
            description="Generate your first document using the form above"
            icon={<FileText className="h-12 w-12 text-muted-foreground" />}
          />
        ) : (
          <div className="space-y-3">
            {exports.map((exportItem) => (
              <div
                key={exportItem.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(exportItem.status)}
                  <div>
                    <h4 className="font-medium">{exportItem.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {exportItem.document_type} • {exportItem.format_type.toUpperCase()}
                      {exportItem.status === 'failed' && exportItem.error_message && (
                        <span className="text-red-600 ml-2">
                          • {exportItem.error_message}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(exportItem.status)}>
                    {exportItem.status}
                  </Badge>
                  {exportItem.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownload(exportItem.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  {exportItem.status === 'failed' && onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetry(exportItem)}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
