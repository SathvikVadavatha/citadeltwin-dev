
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { WorkflowTemplate, WorkflowParameter, WorkflowStep } from '@/types/workflow';

export const useWorkflowTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkflowTemplate[];
    },
    enabled: !!user,
  });

  const { data: systemTemplates, isLoading: systemTemplatesLoading } = useQuery({
    queryKey: ['workflow-templates', 'system'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('is_system_template', true)
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data as WorkflowTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<WorkflowTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      const insertData = {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        building_type: templateData.building_type,
        template_data: templateData.template_data,
        steps: templateData.steps,
        automation_rules: templateData.automation_rules,
        parameters: templateData.parameters,
        is_active: templateData.is_active ?? true,
        is_system_template: false,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('workflow_templates')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      toast.success('Workflow template created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkflowTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      toast.success('Workflow template updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('workflow_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      toast.success('Workflow template deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const getTemplatesByCategory = (category: string) => {
    return templates?.filter(template => template.category === category) || [];
  };

  const getTemplatesByBuildingType = (buildingType: string) => {
    return templates?.filter(template => template.building_type === buildingType) || [];
  };

  return {
    templates: templates || [],
    systemTemplates: systemTemplates || [],
    isLoading: isLoading || systemTemplatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    getTemplatesByBuildingType,
  };
};
