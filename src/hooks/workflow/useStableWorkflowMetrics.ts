
import { useQuery } from '@tanstack/react-query';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';
import { useProjectWorkflows } from '@/hooks/useProjectWorkflows';
import { useBuildingTemplates } from '@/hooks/useBuildingTemplates';
import { useMemo, useRef } from 'react';

export const useStableWorkflowMetrics = () => {
  // Use refs to prevent unnecessary dependency changes
  const templatesQuery = useWorkflowTemplates();
  const workflowsQuery = useProjectWorkflows();
  const buildingTemplatesQuery = useBuildingTemplates();

  // Memoize the dependency values to prevent infinite re-renders
  const stableDeps = useMemo(() => ({
    templatesLength: templatesQuery.templates?.length || 0,
    workflowsLength: workflowsQuery.workflows?.length || 0,
    buildingTemplatesLength: buildingTemplatesQuery.templates?.length || 0,
    templatesLoading: templatesQuery.isLoading,
    workflowsLoading: workflowsQuery.isLoading,
    buildingTemplatesLoading: buildingTemplatesQuery.isLoading
  }), [
    templatesQuery.templates?.length,
    workflowsQuery.workflows?.length,
    buildingTemplatesQuery.templates?.length,
    templatesQuery.isLoading,
    workflowsQuery.isLoading,
    buildingTemplatesQuery.isLoading
  ]);

  // Use a stable query key that doesn't change unnecessarily
  const metrics = useQuery({
    queryKey: ['stable-workflow-metrics', stableDeps],
    queryFn: () => {
      const { templates = [], systemTemplates = [] } = templatesQuery;
      const { workflows = [] } = workflowsQuery;
      const { templates: buildingTemplates = [], projectSetups = [] } = buildingTemplatesQuery;

      const activeWorkflows = workflows.filter(w => w.status === 'active').length;
      const completedWorkflows = workflows.filter(w => w.status === 'completed').length;
      const runningSetups = projectSetups.filter(s => s.status === 'running').length;
      const totalTemplates = templates.length + systemTemplates.length;

      return {
        activeWorkflows,
        completedWorkflows,
        runningSetups,
        totalTemplates,
        workflowTemplates: totalTemplates,
        buildingTemplates: buildingTemplates.length,
        systemTemplates: systemTemplates.length,
        customTemplates: templates.length,
        avgCompletionTime: '8.5d'
      };
    },
    enabled: !stableDeps.templatesLoading && !stableDeps.workflowsLoading && !stableDeps.buildingTemplatesLoading,
    staleTime: 30000,
    gcTime: 300000,
  });

  return {
    metrics: metrics.data,
    isLoading: stableDeps.templatesLoading || stableDeps.workflowsLoading || stableDeps.buildingTemplatesLoading || metrics.isLoading,
    error: metrics.error,
  };
};
