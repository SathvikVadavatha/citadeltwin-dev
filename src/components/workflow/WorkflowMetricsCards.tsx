
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflowMetrics } from '@/hooks/workflow/useWorkflowMetrics';
import { Workflow, FileText, Building, Settings, Clock, CheckCircle } from 'lucide-react';

export const WorkflowMetricsCards: React.FC = () => {
  const { metrics, isLoading } = useWorkflowMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return <div>No metrics available</div>;
  }

  const metricsConfig = [
    {
      title: 'Active Workflows',
      value: metrics.activeWorkflows.toString(),
      description: 'Currently running workflows',
      icon: Workflow,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Completed Workflows',
      value: metrics.completedWorkflows.toString(),
      description: 'Successfully completed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Workflow Templates',
      value: metrics.totalTemplates.toString(),
      description: `${metrics.systemTemplates} system, ${metrics.customTemplates} custom`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Building Templates',
      value: metrics.buildingTemplates.toString(),
      description: 'Available building types',
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Running Setups',
      value: metrics.runningSetups.toString(),
      description: 'Automated project setups',
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Avg. Completion Time',
      value: metrics.avgCompletionTime,
      description: 'Average workflow duration',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metricsConfig.map((metric, index) => (
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
