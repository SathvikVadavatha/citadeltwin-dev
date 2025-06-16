
import { useQuery } from '@tanstack/react-query';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';
import { useProjectWorkflows } from '@/hooks/useProjectWorkflows';
import { useBuildingTemplates } from '@/hooks/useBuildingTemplates';

export const useWorkflowMetrics = () => {
  // Coordinate queries with proper dependencies
  const templatesQuery = useWorkflowTemplates();
  const workflowsQuery = useProjectWorkflows();
  const buildingTemplatesQuery = useBuildingTemplates();

  // Derived metrics with proper memoization
  const metrics = useQuery({
    queryKey: ['workflow-metrics', 
      templatesQuery.templates?.length,
      workflowsQuery.workflows?.length,
      buildingTemplatesQuery.templates?.length
    ],
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
        avgCompletionTime: '8.5d' // Could be calculated from actual data
      };
    },
    enabled: !templatesQuery.isLoading && !workflowsQuery.isLoading && !buildingTemplatesQuery.isLoading,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  return {
    metrics: metrics.data,
    isLoading: templatesQuery.isLoading || workflowsQuery.isLoading || buildingTemplatesQuery.isLoading || metrics.isLoading,
    error: metrics.error,
  };
};
