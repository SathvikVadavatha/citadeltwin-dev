
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

interface DocumentExport {
  id: string;
  title: string;
  document_type: string;
  format_type: 'pdf' | 'docx';
  status: 'generating' | 'completed' | 'failed';
  error_message?: string;
  template_id?: string;
  generated_at: string;
  ai_generated_content?: any;
}

export const useDocumentExports = (uploadId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exports, isLoading, error } = useQuery({
    queryKey: ['document-exports', uploadId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('document_exports')
        .select('*')
        .eq('generated_by', user.id)
        .order('generated_at', { ascending: false });

      if (uploadId) {
        query = query.eq('upload_id', uploadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        document_type: item.document_type,
        format_type: item.format_type,
        status: item.status,
        error_message: item.error_message,
        template_id: item.template_id,
        generated_at: item.generated_at,
        ai_generated_content: item.ai_generated_content
      })) as DocumentExport[];
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const generateDocument = useMutation({
    mutationFn: async (params: {
      templateId: string;
      uploadId?: string;
      documentType: string;
      title: string;
      formatType: 'pdf' | 'docx';
      generationData: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-exports'] });
      toast.success('Document generation started');
    },
    onError: (error) => {
      toast.error(`Failed to generate document: ${error.message}`);
    },
  });

  const downloadDocument = async (exportId: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(`exports/${exportId}`);
    
    if (error) throw error;
    
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${exportId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    exports: exports || [],
    isLoading,
    error,
    generateDocument,
    downloadDocument,
  };
};
