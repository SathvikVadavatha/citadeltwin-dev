
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export const useDocumentTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocumentTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      // Ensure all required fields are present
      const insertData = {
        name: templateData.name,
        template_type: templateData.template_type,
        category: templateData.category,
        description: templateData.description,
        template_content: templateData.template_content,
        format_type: templateData.format_type,
        variables: templateData.variables,
        is_active: templateData.is_active ?? true,
      };

      const { data, error } = await supabase
        .from('document_templates')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Document template created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DocumentTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('document_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Document template updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  return {
    templates: templates || [],
    isLoading,
    createTemplate,
    updateTemplate,
  };
};
