import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { useDocumentExports } from '@/hooks/useDocumentExports';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';
import { LoadingSpinner, LoadingCard, ErrorState, EmptyState } from '@/components/common/LoadingStates';

interface DocumentGeneratorProps {
  uploadId?: string;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ uploadId }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [formatType, setFormatType] = useState<'pdf' | 'docx'>('pdf');
  const [generationData, setGenerationData] = useState<any>({});
  const [validationError, setValidationError] = useState<string>('');

  const { withErrorHandling } = useErrorHandler();
  const { templates, isLoading: templatesLoading, error: templatesError } = useDocumentTemplates();
  const { exports, generateDocument, downloadDocument, isLoading: exportsLoading, error: exportsError } = useDocumentExports(uploadId);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const validateForm = (): boolean => {
    setValidationError('');
    
    if (!selectedTemplateId) {
      setValidationError('Please select a document template');
      return false;
    }
    
    if (!documentTitle.trim()) {
      setValidationError('Please enter a document title');
      return false;
    }
    
    if (documentTitle.trim().length < 3) {
      setValidationError('Document title must be at least 3 characters long');
      return false;
    }
    
    // Check required template variables
    if (selectedTemplate?.variables) {
      const missingFields = selectedTemplate.variables
        .filter((variable: any) => variable.required && variable.type === 'string')
        .filter((variable: any) => !generationData[variable.name]?.trim())
        .map((variable: any) => variable.name.replace(/_/g, ' '));
      
      if (missingFields.length > 0) {
        setValidationError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return false;
      }
    }
    
    return true;
  };

  const handleGenerate = async () => {
    if (!validateForm()) {
      toast.error(validationError);
      return;
    }

    await withErrorHandling(async () => {
      await generateDocument.mutateAsync({
        templateId: selectedTemplateId,
        uploadId,
        documentType: selectedTemplate?.template_type || 'custom',
        title: documentTitle.trim(),
        formatType,
        generationData: {
          ...generationData,
          project_name: documentTitle.trim(),
          generation_timestamp: new Date().toISOString(),
        },
      });
      
      toast.success('Document generation started successfully');
      
      // Clear form after successful generation
      setDocumentTitle('');
      setGenerationData({});
      setSelectedTemplateId('');
    }, 'Document generation');
  };

  const handleDownload = async (exportId: string) => {
    await withErrorHandling(async () => {
      await downloadDocument(exportId);
      toast.success('Download started');
    }, 'Document download');
  };

  const getStatusIcon = (status: string) => {
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
  };

  const getStatusColor = (status: string) => {
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
  };

  if (templatesLoading) {
    return (
      <LoadingCard 
        title="Loading Document Templates" 
        description="Fetching available templates and preparing the document generator..."
      />
    );
  }

  if (templatesError) {
    return (
      <ErrorState
        title="Failed to Load Templates"
        message="Unable to fetch document templates. Please check your connection and try again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!templates.length) {
    return (
      <EmptyState
        title="No Templates Available"
        description="No document templates are available. Please contact your administrator to set up templates."
        icon={<AlertTriangle className="h-12 w-12 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Document Generator
          </CardTitle>
          <CardDescription>
            Generate automated documents including permit applications, structural reports, and technical documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-select">Document Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.template_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="format-select">Format</Label>
              <Select value={formatType} onValueChange={(value: 'pdf' | 'docx') => setFormatType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="document-title">Document Title *</Label>
            <Input
              id="document-title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title (minimum 3 characters)"
              className={validationError && !documentTitle.trim() ? 'border-red-500' : ''}
            />
          </div>

          {selectedTemplate && (
            <div>
              <Label>Template Variables</Label>
              <div className="mt-2 space-y-3">
                {selectedTemplate.variables
                  .filter((variable: any) => variable.type === 'string' && variable.required)
                  .map((variable: any) => (
                    <div key={variable.name}>
                      <Label htmlFor={variable.name}>
                        {variable.name.replace(/_/g, ' ')} *
                      </Label>
                      <Input
                        id={variable.name}
                        value={generationData[variable.name] || ''}
                        onChange={(e) =>
                          setGenerationData(prev => ({
                            ...prev,
                            [variable.name]: e.target.value,
                          }))
                        }
                        placeholder={`Enter ${variable.name.replace(/_/g, ' ')}`}
                        className={validationError && !generationData[variable.name]?.trim() ? 'border-red-500' : ''}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplateId || !documentTitle || generateDocument.isPending}
            className="w-full"
          >
            {generateDocument.isPending ? (
              <LoadingSpinner variant="inline" size="sm" text="Generating Document..." />
            ) : (
              'Generate Document'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Document Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Documents</CardTitle>
          <CardDescription>
            View and download your generated documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exportsLoading ? (
            <LoadingSpinner text="Loading document history..." />
          ) : exportsError ? (
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
                        onClick={() => handleDownload(exportItem.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    {exportItem.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Reset form with previous data for retry
                          setSelectedTemplateId(exportItem.template_id || '');
                          setDocumentTitle(exportItem.title);
                          setFormatType(exportItem.format_type);
                        }}
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
    </div>
  );
};
