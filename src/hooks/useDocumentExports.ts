
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { ErrorHandler } from '@/utils/errorHandling';

export interface DocumentExport {
  id: string;
  upload_id?: string;
  project_id?: string;
  template_id?: string;
  document_type: string;
  title: string;
  status: 'generating' | 'completed' | 'failed' | 'cancelled';
  format_type: 'pdf' | 'docx';
  file_path?: string;
  file_size?: number;
  generation_data: any;
  ai_generated_content?: any;
  error_message?: string;
  generated_by: string;
  generated_at: string;
  completed_at?: string;
}

export const useDocumentExports = (projectId?: string, uploadId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exports, isLoading, error } = useQuery({
    queryKey: ['document-exports', projectId, uploadId, user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        let query = (supabase as any)
          .from('document_exports')
          .select('*')
          .eq('generated_by', user.id)
          .order('generated_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        } else if (uploadId) {
          query = query.eq('upload_id', uploadId);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch documents: ${error.message}`);
        }
        
        return (data || []) as DocumentExport[];
      } catch (err) {
        throw new Error('Unable to load document history. Please try refreshing the page.');
      }
    },
    enabled: !!user,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const generateDocument = useMutation({
    mutationFn: async ({
      templateId,
      projectId,
      uploadId,
      documentType,
      title,
      formatType,
      generationData
    }: {
      templateId: string;
      projectId?: string;
      uploadId?: string;
      documentType: string;
      title: string;
      formatType: 'pdf' | 'docx';
      generationData: any;
    }) => {
      if (!user) {
        throw new Error('You must be logged in to generate documents');
      }

      if (!title.trim()) {
        throw new Error('Document title is required');
      }

      if (!templateId) {
        throw new Error('Please select a document template');
      }

      try {
        // Create export record
        const { data: exportRecord, error: exportError } = await (supabase as any)
          .from('document_exports')
          .insert({
            project_id: projectId,
            upload_id: uploadId,
            template_id: templateId,
            document_type: documentType,
            title: title.trim(),
            format_type: formatType,
            generation_data: generationData,
            generated_by: user.id,
          })
          .select()
          .single();

        if (exportError) {
          throw new Error(`Failed to create document record: ${exportError.message}`);
        }

        // Call generation function
        const { data, error } = await supabase.functions.invoke('generate-document', {
          body: {
            exportId: exportRecord.id,
            templateId,
            projectId,
            uploadId,
            formatType,
            generationData,
          },
        });

        if (error) {
          throw new Error(`Document generation failed: ${error.message}`);
        }
        
        return { exportRecord, generationResult: data };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Document generation failed';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-exports'] });
    },
    onError: (error: any) => {
      ErrorHandler.handle(error, 'Document generation');
    },
  });

  const downloadDocument = async (exportId: string) => {
    try {
      if (!exportId) {
        throw new Error('Export ID is required for download');
      }

      const { data: exportRecord, error } = await (supabase as any)
        .from('document_exports')
        .select('file_path, title, format_type, status')
        .eq('id', exportId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch document details: ${error.message}`);
      }

      if (exportRecord.status !== 'completed') {
        throw new Error('Document is not ready for download yet');
      }

      if (!exportRecord?.file_path) {
        throw new Error('Document file not found');
      }

      const { data: fileData } = supabase.storage
        .from('documents')
        .getPublicUrl(exportRecord.file_path);

      if (!fileData.publicUrl) {
        throw new Error('Unable to generate download link');
      }

      // Create download link
      const link = document.createElement('a');
      link.href = fileData.publicUrl;
      link.download = `${exportRecord.title}.${exportRecord.format_type}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      ErrorHandler.handle(error, 'Document download');
    }
  };

  return {
    exports: exports || [],
    isLoading,
    error,
    generateDocument,
    downloadDocument,
  };
};
