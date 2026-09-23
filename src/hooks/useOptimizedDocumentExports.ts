
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
  generated_at: string;
  // Storage object key set by generate-advanced-document once the file is actually
  // uploaded — only present once status is 'completed'. Used to gate Download.
  file_path?: string | null;
  // The exact request body originally sent to generate-advanced-document — reused
  // verbatim by retryDocument so a retry re-runs the same generation, not a guess at it.
  generation_data?: Record<string, unknown> | null;
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
    
    // Map the data to match our interface
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      document_type: item.document_type,
      format_type: item.format_type,
      status: item.status,
      error_message: item.error_message,
      template_id: item.template_id,
      generated_at: item.generated_at,
      file_path: item.file_path,
      generation_data: item.generation_data as Record<string, unknown> | null,
    })) as DocumentExport[];
  }, [user, uploadId]);

  const { data: exports, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (replaces cacheTime)
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
    // generate-document (the old target) never actually gets called with the exportId it
    // requires, so its .update().eq('id', exportId) always no-ops — see the investigation
    // that led to this switch. generate-advanced-document correctly inserts the
    // document_exports row itself and now also uploads the real file to Storage.
    mutationFn: useCallback(async (params: {
      templateType: string;
      templateId?: string | null;
      uploadId?: string;
      title: string;
      description: string;
      jurisdiction?: string;
      clientRequirements?: string;
      formatType?: 'pdf' | 'docx';
      aiEnhancements?: Record<string, string>;
      formatPreferences?: {
        includeExecutiveSummary: boolean;
        includeVisualizations: boolean;
        clientCustomization: boolean;
      };
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-advanced-document', {
        body: {
          template_type: params.templateType,
          template_id: params.templateId ?? null,
          upload_id: params.uploadId ?? null,
          format_type: params.formatType ?? 'pdf',
          project_data: {
            title: params.title,
            description: params.description,
            jurisdiction: params.jurisdiction,
            clientRequirements: params.clientRequirements,
          },
          ai_enhancements: params.aiEnhancements ?? {},
          format_preferences: params.formatPreferences ?? {
            includeExecutiveSummary: false,
            includeVisualizations: false,
            clientCustomization: false,
          },
          generated_by: user.id,
          generation_timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;
      return data;
    }, [user]),
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

  const onRetrySuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['document-exports'] });
    toast.success('Retry started');
  }, [queryClient]);

  const onRetryError = useCallback((error: Error) => {
    toast.error(`Retry failed: ${error.message}`);
  }, []);

  // Re-runs generation for a failed export using the exact request body that was
  // originally sent to generate-advanced-document. This creates a fresh document_exports
  // row (the edge function always inserts) rather than mutating the failed one in place —
  // consistent with how every other generate-advanced-document call is handled.
  const retryDocument = useMutation({
    mutationFn: useCallback(async (exportItem: { generation_data?: Record<string, unknown> | null }) => {
      if (!exportItem.generation_data) {
        throw new Error('This export has no saved generation data to retry — create a new document instead.');
      }

      const { data, error } = await supabase.functions.invoke('generate-advanced-document', {
        body: {
          ...exportItem.generation_data,
          generation_timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;
      return data;
    }, []),
    onSuccess: onRetrySuccess,
    onError: onRetryError,
  });

  // Memoize return object
  return useMemo(() => ({
    exports: exports || [],
    isLoading,
    error,
    generateDocument,
    downloadDocument,
    retryDocument,
  }), [exports, isLoading, error, generateDocument, downloadDocument, retryDocument]);
};
