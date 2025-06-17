
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface DocumentTemplate {
  id: string;
  name: string;
  template_type: 'permit_application' | 'structural_report' | 'technical_documentation' | 'compliance_report' | 'custom';
  category: string;
  description?: string;
  template_content: any;
  format_type: 'pdf' | 'docx' | 'both';
  variables: any[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useOptimizedDocumentTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Memoize query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => ['document-templates'], []);

  // Memoize query function to prevent recreation
  const queryFn = useCallback(async () => {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DocumentTemplate[];
  }, []);

  const { data: templates, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
  });

  // Memoize success callback to prevent recreation
  const onCreateSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    toast.success('Document template created successfully');
  }, [queryClient, queryKey]);

  // Memoize error callback to prevent recreation
  const onCreateError = useCallback((error: Error) => {
    toast.error(`Failed to create template: ${error.message}`);
  }, []);

  const createTemplate = useMutation({
    mutationFn: useCallback(async (templateData: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      const insertData = {
        name: templateData.name,
        template_type: templateData.template_type,
        category: templateData.category,
        description: templateData.description,
        template_content: templateData.template_content,
        format_type: templateData.format_type,
        variables: templateData.variables,
        is_active: templateData.is_active ?? true,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('document_templates')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, [user]),
    onSuccess: onCreateSuccess,
    onError: onCreateError,
  });

  // Memoize update success callback
  const onUpdateSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    toast.success('Document template updated successfully');
  }, [queryClient, queryKey]);

  // Memoize update error callback
  const onUpdateError = useCallback((error: Error) => {
    toast.error(`Failed to update template: ${error.message}`);
  }, []);

  const updateTemplate = useMutation({
    mutationFn: useCallback(async ({ id, ...updates }: Partial<DocumentTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('document_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, []),
    onSuccess: onUpdateSuccess,
    onError: onUpdateError,
  });

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    templates: templates || [],
    isLoading,
    error,
    createTemplate,
    updateTemplate,
  }), [templates, isLoading, error, createTemplate, updateTemplate]);
};
