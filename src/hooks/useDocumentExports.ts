
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

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

  const { data: exports, isLoading } = useQuery({
    queryKey: ['document-exports', projectId, uploadId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('document_exports')
        .select('*')
        .eq('generated_by', user!.id)
        .order('generated_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (uploadId) {
        query = query.eq('upload_id', uploadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as DocumentExport[];
    },
    enabled: !!user,
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
      if (!user) throw new Error('User not authenticated');

      const { data: exportRecord, error: exportError } = await supabase
        .from('document_exports')
        .insert({
          project_id: projectId,
          upload_id: uploadId,
          template_id: templateId,
          document_type: documentType,
          title,
          format_type: formatType,
          generation_data: generationData,
          generated_by: user.id,
        })
        .select()
        .single();

      if (exportError) throw exportError;

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

      if (error) throw error;
      return { exportRecord, generationResult: data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-exports'] });
      toast.success('Document generation started successfully');
    },
    onError: (error) => {
      toast.error(`Failed to generate document: ${error.message}`);
    },
  });

  const downloadDocument = async (exportId: string) => {
    try {
      const { data: exportRecord } = await supabase
        .from('document_exports')
        .select('file_path, title, format_type')
        .eq('id', exportId)
        .single();

      if (!exportRecord?.file_path) {
        toast.error('Document file not found');
        return;
      }

      const { data: fileData } = supabase.storage
        .from('documents')
        .getPublicUrl(exportRecord.file_path);

      const link = document.createElement('a');
      link.href = fileData.publicUrl;
      link.download = `${exportRecord.title}.${exportRecord.format_type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  return {
    exports: exports || [],
    isLoading,
    generateDocument,
    downloadDocument,
  };
};
