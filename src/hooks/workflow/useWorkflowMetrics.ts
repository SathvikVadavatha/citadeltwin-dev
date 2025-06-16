
import { useQuery } from '@tanstack/react-query';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';
import { useProjectWorkflows } from '@/hooks/useProjectWorkflows';
import { useBuildingTemplates } from '@/hooks/useBuildingTemplates';
import { useMemo } from 'react';

export const useWorkflowMetrics = () => {
  // Get data from underlying hooks
  const templatesQuery = useWorkflowTemplates();
  const workflowsQuery = useProjectWorkflows();
  const buildingTemplatesQuery = useBuildingTemplates();

  // Create stable dependency key to prevent infinite re-renders
  const stableDependencyKey = useMemo(() => {
    return [
      templatesQuery.templates?.length || 0,
      templatesQuery.systemTemplates?.length || 0,
      workflowsQuery.workflows?.length || 0,
      buildingTemplatesQuery.templates?.length || 0,
      buildingTemplatesQuery.projectSetups?.length || 0
    ].join('-');
  }, [
    templatesQuery.templates?.length,
    templatesQuery.systemTemplates?.length,
    workflowsQuery.workflows?.length,
    buildingTemplatesQuery.templates?.length,
    buildingTemplatesQuery.projectSetups?.length
  ]);

  // Derived metrics with stable query key
  const metrics = useQuery({
    queryKey: ['workflow-metrics-stable', stableDependencyKey],
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
    enabled: !templatesQuery.isLoading && !workflowsQuery.isLoading && !buildingTemplatesQuery.isLoading,
    staleTime: 30000,
    gcTime: 300000,
  });

  return {
    metrics: metrics.data,
    isLoading: templatesQuery.isLoading || workflowsQuery.isLoading || buildingTemplatesQuery.isLoading || metrics.isLoading,
    error: metrics.error,
  };
};
