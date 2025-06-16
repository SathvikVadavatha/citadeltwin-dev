
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { BuildingTypeTemplate, AutomatedProjectSetup } from '@/types/workflow';

// Helper function to transform database data to TypeScript interfaces
const transformBuildingTemplate = (data: any): BuildingTypeTemplate => ({
  ...data,
  default_parameters: data.default_parameters as Record<string, any>,
  required_compliance_checks: data.required_compliance_checks as string[],
  typical_materials: data.typical_materials as string[],
  standard_elements: data.standard_elements as string[],
  design_requirements: data.design_requirements as Record<string, any>,
  code_requirements: data.code_requirements as Record<string, any>,
});

const transformAutomatedSetup = (data: any): AutomatedProjectSetup => ({
  ...data,
  setup_parameters: data.setup_parameters as Record<string, any>,
  steps_completed: data.steps_completed as string[],
  error_logs: data.error_logs as string[],
});

export const useBuildingTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['building-type-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('building_type_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data.map(transformBuildingTemplate);
    },
    enabled: !!user,
  });

  const { data: projectSetups, isLoading: setupsLoading } = useQuery({
    queryKey: ['automated-project-setups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_project_setups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(transformAutomatedSetup);
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<BuildingTypeTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      const insertData = {
        ...templateData,
        default_parameters: templateData.default_parameters as any,
        required_compliance_checks: templateData.required_compliance_checks as any,
        typical_materials: templateData.typical_materials as any,
        standard_elements: templateData.standard_elements as any,
        design_requirements: templateData.design_requirements as any,
        code_requirements: templateData.code_requirements as any,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('building_type_templates')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return transformBuildingTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building-type-templates'] });
      toast.success('Building template created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BuildingTypeTemplate> & { id: string }) => {
      const updateData = {
        ...updates,
        default_parameters: updates.default_parameters as any,
        required_compliance_checks: updates.required_compliance_checks as any,
        typical_materials: updates.typical_materials as any,
        standard_elements: updates.standard_elements as any,
        design_requirements: updates.design_requirements as any,
        code_requirements: updates.code_requirements as any,
      };

      const { data, error } = await supabase
        .from('building_type_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformBuildingTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building-type-templates'] });
      toast.success('Building template updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const createAutomatedSetup = useMutation({
    mutationFn: async (setupData: Omit<AutomatedProjectSetup, 'id' | 'created_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      const insertData = {
        ...setupData,
        setup_parameters: setupData.setup_parameters as any,
        steps_completed: setupData.steps_completed as any,
        error_logs: setupData.error_logs as any,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('automated_project_setups')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return transformAutomatedSetup(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-project-setups'] });
      toast.success('Automated project setup initiated');
    },
    onError: (error) => {
      toast.error(`Failed to create automated setup: ${error.message}`);
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
    projectSetups: projectSetups || [],
    isLoading: isLoading || setupsLoading,
    createTemplate,
    updateTemplate,
    createAutomatedSetup,
    getTemplatesByCategory,
    getTemplatesByBuildingType,
  };
};
