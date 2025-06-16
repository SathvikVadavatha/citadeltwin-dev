
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { ProjectWorkflow, WorkflowExecution, WorkflowStep } from '@/types/workflow';

// Helper function to transform database data to TypeScript interfaces
const transformProjectWorkflow = (data: any): ProjectWorkflow => ({
  ...data,
  steps: data.steps as WorkflowStep[],
  automation_config: data.automation_config as Record<string, any>,
  progress_data: data.progress_data as Record<string, any>,
});

const transformWorkflowExecution = (data: any): WorkflowExecution => ({
  ...data,
  input_data: data.input_data as Record<string, any>,
  output_data: data.output_data as Record<string, any>,
});

export const useProjectWorkflows = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['project-workflows', projectId],
    queryFn: async () => {
      let query = supabase
        .from('project_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(transformProjectWorkflow);
    },
    enabled: !!user,
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select(`
          *,
          project_workflows!inner(project_id)
        `)
        .eq('project_workflows.project_id', projectId || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(transformWorkflowExecution);
    },
    enabled: !!user && !!projectId,
  });

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
      return transformProjectWorkflow(data);
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
      return transformProjectWorkflow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows'] });
      toast.success('Workflow updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    },
  });

  const executeStep = useMutation({
    mutationFn: async ({ workflowId, stepIndex, inputData }: {
      workflowId: string;
      stepIndex: number;
      inputData?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('execute_workflow_step', {
        p_workflow_id: workflowId,
        p_step_index: stepIndex,
        p_input_data: inputData || {}
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast.success('Workflow step started');
    },
    onError: (error) => {
      toast.error(`Failed to execute step: ${error.message}`);
    },
  });

  const completeStep = useMutation({
    mutationFn: async ({ executionId, outputData, success, errorMessage }: {
      executionId: string;
      outputData?: Record<string, any>;
      success?: boolean;
      errorMessage?: string;
    }) => {
      const { data, error } = await supabase.rpc('complete_workflow_step', {
        p_execution_id: executionId,
        p_output_data: outputData || {},
        p_success: success ?? true,
        p_error_message: errorMessage
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast.success('Workflow step completed');
    },
    onError: (error) => {
      toast.error(`Failed to complete step: ${error.message}`);
    },
  });

  const pauseWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      const { data, error } = await supabase
        .from('project_workflows')
        .update({ status: 'paused' })
        .eq('id', workflowId)
        .select()
        .single();

      if (error) throw error;
      return transformProjectWorkflow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows'] });
      toast.success('Workflow paused');
    },
  });

  const resumeWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      const { data, error } = await supabase
        .from('project_workflows')
        .update({ status: 'active' })
        .eq('id', workflowId)
        .select()
        .single();

      if (error) throw error;
      return transformProjectWorkflow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows'] });
      toast.success('Workflow resumed');
    },
  });

  return {
    workflows: workflows || [],
    executions: executions || [],
    isLoading: workflowsLoading || executionsLoading,
    createWorkflow,
    updateWorkflow,
    executeStep,
    completeStep,
    pauseWorkflow,
    resumeWorkflow,
  };
};
