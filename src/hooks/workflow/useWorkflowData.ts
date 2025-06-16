
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { ProjectWorkflow, WorkflowExecution } from '@/types/workflow';

// Helper function to transform database data to TypeScript interfaces
const transformProjectWorkflow = (data: any): ProjectWorkflow => ({
  ...data,
  steps: data.steps as any[],
  automation_config: data.automation_config as Record<string, any>,
  progress_data: data.progress_data as Record<string, any>,
});

const transformWorkflowExecution = (data: any): WorkflowExecution => ({
  ...data,
  input_data: data.input_data as Record<string, any>,
  output_data: data.output_data as Record<string, any>,
});

export const useWorkflowData = (projectId?: string) => {
  const { user } = useAuth();

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

  return {
    workflows: workflows || [],
    executions: executions || [],
    isLoading: workflowsLoading || executionsLoading,
  };
};
