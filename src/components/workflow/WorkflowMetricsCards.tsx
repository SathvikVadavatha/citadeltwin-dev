
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';
import { useProjectWorkflows } from '@/hooks/useProjectWorkflows';
import { useBuildingTemplates } from '@/hooks/useBuildingTemplates';
import { Workflow, FileText, Building, Settings, Clock, CheckCircle } from 'lucide-react';

export const WorkflowMetricsCards: React.FC = () => {
  const { templates, systemTemplates } = useWorkflowTemplates();
  const { workflows } = useProjectWorkflows();
  const { templates: buildingTemplates, projectSetups } = useBuildingTemplates();

  const activeWorkflows = workflows.filter(w => w.status === 'active').length;
  const completedWorkflows = workflows.filter(w => w.status === 'completed').length;
  const runningSetups = projectSetups.filter(s => s.status === 'running').length;
  const totalTemplates = templates.length + systemTemplates.length;

  const metrics = [
    {
      title: 'Active Workflows',
      value: activeWorkflows.toString(),
      description: 'Currently running workflows',
      icon: Workflow,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Completed Workflows',
      value: completedWorkflows.toString(),
      description: 'Successfully completed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Workflow Templates',
      value: totalTemplates.toString(),
      description: `${systemTemplates.length} system, ${templates.length} custom`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Building Templates',
      value: buildingTemplates.length.toString(),
      description: 'Available building types',
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Running Setups',
      value: runningSetups.toString(),
      description: 'Automated project setups',
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Avg. Completion Time',
      value: '8.5d',
      description: 'Average workflow duration',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
