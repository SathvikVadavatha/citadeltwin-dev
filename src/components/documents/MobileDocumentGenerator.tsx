
import React, { useCallback } from 'react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { useDocumentExports } from '@/hooks/useDocumentExports';
import { useErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';
import { LoadingCard, ErrorState, EmptyState } from '@/components/common/LoadingStates';
import { DocumentGeneratorForm } from './DocumentGeneratorForm';
import { DocumentExportsList } from './DocumentExportsList';
import { AlertTriangle } from 'lucide-react';

interface MobileDocumentGeneratorProps {
  uploadId?: string;
}

export const MobileDocumentGenerator: React.FC<MobileDocumentGeneratorProps> = ({ uploadId }) => {
  const { withErrorHandling } = useErrorHandler();
  const { templates, isLoading: templatesLoading, error: templatesError } = useDocumentTemplates();
  const { exports, generateDocument, downloadDocument, isLoading: exportsLoading, error: exportsError } = useDocumentExports(uploadId);

  const handleGenerate = useCallback(async (data: {
    templateId: string;
    title: string;
    formatType: 'pdf' | 'docx';
    generationData: any;
  }) => {
    await withErrorHandling(async () => {
      const selectedTemplate = templates.find(t => t.id === data.templateId);
      
      await generateDocument.mutateAsync({
        templateId: data.templateId,
        uploadId,
        documentType: selectedTemplate?.template_type || 'custom',
        title: data.title,
        formatType: data.formatType,
        generationData: data.generationData,
      });
      
      toast.success('Document generation started');
    }, 'Document generation');
  }, [withErrorHandling, generateDocument, uploadId, templates]);

  const handleDownload = useCallback(async (exportId: string) => {
    await withErrorHandling(async () => {
      await downloadDocument(exportId);
      toast.success('Download started');
    }, 'Document download');
  }, [withErrorHandling, downloadDocument]);

  if (templatesLoading) {
    return (
      <LoadingCard 
        title="Loading Templates" 
        description="Fetching available document templates..."
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
        description="No document templates are available. Contact your administrator to set up templates."
        icon={<AlertTriangle className="h-12 w-12 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-4">
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
      />
    </div>
  );
};
