
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { useWorkflowData } from '@/hooks/workflow/useWorkflowData';
import { useWorkflowExecution } from '@/hooks/workflow/useWorkflowExecution';
import type { ProjectWorkflow } from '@/types/workflow';

// Simplified version that delegates to specialized hooks
export const useProjectWorkflows = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workflowData = useWorkflowData(projectId);
  const workflowExecution = useWorkflowExecution();

  const createWorkflow = useMutation({
    mutationFn: async (workflowData: Omit<ProjectWorkflow, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      const insertData = {
        project_id: workflowData.project_id,
        template_id: workflowData.template_id,
        name: workflowData.name,
        status: workflowData.status,
        current_step: workflowData.current_step,
        steps: workflowData.steps as any,
        automation_config: workflowData.automation_config as any,
        progress_data: workflowData.progress_data as any,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('project_workflows')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows'] });
      toast.success('Workflow created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    },
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectWorkflow> & { id: string }) => {
      const updateData = {
        ...updates,
        steps: updates.steps as any,
        automation_config: updates.automation_config as any,
        progress_data: updates.progress_data as any,
      };

      const { data, error } = await supabase
        .from('project_workflows')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows'] });
      toast.success('Workflow updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    },
  });

  return {
    // Data from specialized hook
    workflows: workflowData.workflows,
    executions: workflowData.executions,
    isLoading: workflowData.isLoading,
    
    // Mutations
    createWorkflow,
    updateWorkflow,
    
    // Execution methods from specialized hook
    executeStep: workflowExecution.executeStep,
    completeStep: workflowExecution.completeStep,
    pauseWorkflow: workflowExecution.pauseWorkflow,
    resumeWorkflow: workflowExecution.resumeWorkflow,
  };
};
