
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWorkflowExecution = () => {
  const queryClient = useQueryClient();

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
      return data;
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows'] });
      toast.success('Workflow resumed');
    },
  });

  return {
    executeStep,
    completeStep,
    pauseWorkflow,
    resumeWorkflow,
  };
};
