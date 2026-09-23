
import React, { useCallback } from 'react';
import { useOptimizedDocumentTemplates } from '@/hooks/useOptimizedDocumentTemplates';
import { useOptimizedDocumentExports } from '@/hooks/useOptimizedDocumentExports';
import { useErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';
import { LoadingCard, ErrorState, EmptyState } from '@/components/common/LoadingStates';
import { DocumentGeneratorForm } from './DocumentGeneratorForm';
import { DocumentExportsList } from './DocumentExportsList';
import { AlertTriangle } from 'lucide-react';

interface DocumentGeneratorProps {
  uploadId?: string;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ uploadId }) => {
  const { withErrorHandling } = useErrorHandler();
  const { templates, isLoading: templatesLoading, error: templatesError } = useOptimizedDocumentTemplates();
  const { exports, generateDocument, downloadDocument, retryDocument, isLoading: exportsLoading, error: exportsError } = useOptimizedDocumentExports(uploadId);

  const handleGenerate = useCallback(async (data: {
    templateId: string;
    title: string;
    formatType: 'pdf' | 'docx';
    generationData: any;
  }) => {
    await withErrorHandling(async () => {
      const selectedTemplate = templates.find(t => t.id === data.templateId);

      // DocumentGeneratorForm only collects the template's named variables, not a free-text
      // description — build a readable description out of whatever variables were filled in
      // so generate-advanced-document's project_data.description isn't empty.
      const { project_name, generation_timestamp, ...variableFields } = data.generationData ?? {};
      const description =
        Object.entries(variableFields)
          .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
          .join('\n') || data.title;

      await generateDocument.mutateAsync({
        templateType: selectedTemplate?.template_type || 'custom',
        templateId: data.templateId,
        uploadId,
        title: data.title,
        description,
        formatType: data.formatType,
      });

      toast.success('Document generation started successfully');
    }, 'Document generation');
  }, [withErrorHandling, generateDocument, uploadId, templates]);

  const handleDownload = useCallback(async (exportId: string) => {
    await withErrorHandling(async () => {
      await downloadDocument(exportId);
      toast.success('Download started');
    }, 'Document download');
  }, [withErrorHandling, downloadDocument]);

  const handleRetry = useCallback(async (exportItem: { generation_data?: Record<string, unknown> | null }) => {
    await withErrorHandling(async () => {
      await retryDocument.mutateAsync(exportItem);
    }, 'Document retry');
  }, [withErrorHandling, retryDocument]);

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
      <DocumentGeneratorForm
        templates={templates}
        onGenerate={handleGenerate}
        isGenerating={generateDocument.isPending}
      />
      
      <DocumentExportsList
        exports={exports}
        isLoading={exportsLoading}
        error={exportsError}
        onDownload={handleDownload}
        onRetry={handleRetry}
      />
    </div>
  );
};
