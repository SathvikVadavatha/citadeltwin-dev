
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
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
  created_at: string;
}

export const useOptimizedDocumentExports = (uploadId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Memoize query key
  const queryKey = useMemo(() => ['document-exports', uploadId], [uploadId]);

  // Memoize query function
  const queryFn = useCallback(async () => {
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
    return data as DocumentExport[];
  }, [user, uploadId]);

  const { data: exports, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoize mutation success handler
  const onGenerateSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['document-exports'] });
    toast.success('Document generation started');
  }, [queryClient]);

  // Memoize mutation error handler
  const onGenerateError = useCallback((error: Error) => {
    toast.error(`Failed to generate document: ${error.message}`);
  }, []);

  const generateDocument = useMutation({
    mutationFn: useCallback(async (params: {
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
    }, []),
    onSuccess: onGenerateSuccess,
    onError: onGenerateError,
  });

  // Memoize download function
  const downloadDocument = useCallback(async (exportId: string) => {
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
  }, []);

  // Memoize return object
  return useMemo(() => ({
    exports: exports || [],
    isLoading,
    error,
    generateDocument,
    downloadDocument,
  }), [exports, isLoading, error, generateDocument, downloadDocument]);
};
