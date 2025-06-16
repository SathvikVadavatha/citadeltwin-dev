
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { BuildingTypeTemplate, AutomatedProjectSetup } from '@/types/workflow';

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
      return data as BuildingTypeTemplate[];
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
      return data as AutomatedProjectSetup[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<BuildingTypeTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      const insertData = {
        ...templateData,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('building_type_templates')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('building_type_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('automated_project_setups')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
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
