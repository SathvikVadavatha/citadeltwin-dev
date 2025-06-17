
import React, { useState } from 'react';
import { MobileResponsiveCard } from '@/components/mobile/MobileResponsiveCard';
import { MobileResponsiveGrid } from '@/components/mobile/MobileResponsiveGrid';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { useDocumentExports } from '@/hooks/useDocumentExports';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

interface MobileDocumentGeneratorProps {
  uploadId?: string;
}

export const MobileDocumentGenerator: React.FC<MobileDocumentGeneratorProps> = ({ uploadId }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [formatType, setFormatType] = useState<'pdf' | 'docx'>('pdf');
  const [generationData, setGenerationData] = useState<any>({});
  const [validationError, setValidationError] = useState<string>('');

  const { isMobile, isTouch } = useViewport();
  const { withErrorHandling } = useErrorHandler();
  const { templates, isLoading: templatesLoading } = useDocumentTemplates();
  const { exports, generateDocument, downloadDocument, isLoading: exportsLoading } = useDocumentExports(uploadId);

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
    
    if (selectedTemplate?.variables) {
      const missingFields = selectedTemplate.variables
        .filter((variable: any) => variable.required && variable.type === 'string')
        .filter((variable: any) => !generationData[variable.name]?.trim())
        .map((variable: any) => variable.name.replace(/_/g, ' '));
      
      if (missingFields.length > 0) {
        setValidationError(`Please fill in: ${missingFields.join(', ')}`);
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
      
      toast.success('Document generation started');
      
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
      <MobileResponsiveCard className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Loading templates...</span>
        </div>
      </MobileResponsiveCard>
    );
  }

  if (!templates.length) {
    return (
      <MobileResponsiveCard className="flex items-center justify-center p-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No document templates available. Contact your administrator.
          </AlertDescription>
        </Alert>
      </MobileResponsiveCard>
    );
  }

  return (
    <div className="space-y-4">
      <MobileResponsiveCard
        title="Document Generator"
        description="Generate automated documents including permit applications and reports"
      >
        <div className="space-y-4">
          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <MobileResponsiveGrid mobileColumns={1} tabletColumns={2} gap="sm">
            <div>
              <Label htmlFor="template-select">Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className={cn(isTouch && 'min-h-touch')}>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="format-select">Format</Label>
              <Select value={formatType} onValueChange={(value: 'pdf' | 'docx') => setFormatType(value)}>
                <SelectTrigger className={cn(isTouch && 'min-h-touch')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </MobileResponsiveGrid>

          <div>
            <Label htmlFor="document-title">Document Title *</Label>
            <Input
              id="document-title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title"
              className={cn(
                isTouch && 'min-h-touch',
                validationError && !documentTitle.trim() ? 'border-red-500' : ''
              )}
            />
          </div>

          {selectedTemplate?.variables && (
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
                        className={cn(
                          isTouch && 'min-h-touch',
                          validationError && !generationData[variable.name]?.trim() ? 'border-red-500' : ''
                        )}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplateId || !documentTitle || generateDocument.isPending}
            className={cn('w-full', isTouch && 'min-h-touch')}
          >
            {generateDocument.isPending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Document'
            )}
          </Button>
        </div>
      </MobileResponsiveCard>

      <MobileResponsiveCard
        title="Generated Documents"
        description="View and download your documents"
      >
        {exportsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-5 w-5 animate-spin mr-2" />
            <span>Loading...</span>
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No documents generated yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exports.map((exportItem) => (
              <div
                key={exportItem.id}
                className={cn(
                  'flex items-center justify-between p-4 border rounded-lg transition-colors',
                  isMobile ? 'flex-col space-y-2' : 'flex-row',
                  'hover:bg-muted/50'
                )}
              >
                <div className={cn('flex items-center gap-3', isMobile && 'w-full')}>
                  {getStatusIcon(exportItem.status)}
                  <div className={cn(isMobile && 'flex-1')}>
                    <h4 className="font-medium text-sm">{exportItem.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {exportItem.document_type} • {exportItem.format_type.toUpperCase()}
                    </p>
                    {exportItem.status === 'failed' && exportItem.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        {exportItem.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className={cn('flex items-center gap-2', isMobile && 'w-full justify-between')}>
                  <Badge className={cn(getStatusColor(exportItem.status), 'text-xs')}>
                    {exportItem.status}
                  </Badge>
                  {exportItem.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(exportItem.id)}
                      className={cn(isTouch && 'min-h-touch min-w-[80px]')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </MobileResponsiveCard>
    </div>
  );
};
