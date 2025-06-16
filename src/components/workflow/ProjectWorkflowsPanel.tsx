
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectWorkflows } from '@/hooks/useProjectWorkflows';
import { useProjects } from '@/hooks/useProjects';
import { Play, Pause, Square, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const ProjectWorkflowsPanel: React.FC = () => {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { workflows, executions, isLoading, executeStep, pauseWorkflow, resumeWorkflow } = useProjectWorkflows(selectedProjectId);

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getProgressPercentage = (workflow: any) => {
    if (!workflow.steps.length) return 0;
    return Math.round((workflow.current_step / workflow.steps.length) * 100);
  };

  const getCurrentStepName = (workflow: any) => {
    if (workflow.current_step >= workflow.steps.length) return 'Completed';
    return workflow.steps[workflow.current_step]?.name || 'Unknown';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading project workflows...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Project Selection */}
      <div className="flex gap-4">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProjectId ? (
        <>
          {/* Workflows List */}
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                        <Badge variant="outline">
                          Step {workflow.current_step + 1} of {workflow.steps.length}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {workflow.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => executeStep.mutate({ workflowId: workflow.id, stepIndex: workflow.current_step })}
                            disabled={workflow.current_step >= workflow.steps.length}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Execute Step
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseWorkflow.mutate(workflow.id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {workflow.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => resumeWorkflow.mutate(workflow.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{getProgressPercentage(workflow)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(workflow)} className="h-2" />
                  </div>

                  {/* Current Step */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Current Step:</span>
                    <span>{getCurrentStepName(workflow)}</span>
                  </div>

                  {/* Workflow Steps */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Workflow Steps</h4>
                    <div className="space-y-1">
                      {workflow.steps.map((step, index) => {
                        const isCompleted = index < workflow.current_step;
                        const isCurrent = index === workflow.current_step;
                        const isPending = index > workflow.current_step;

                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded text-sm ${
                              isCompleted ? 'bg-green-50 text-green-700' :
                              isCurrent ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-50 text-gray-500'
                            }`}
                          >
                            {isCompleted && <CheckCircle className="h-4 w-4" />}
                            {isCurrent && <Clock className="h-4 w-4" />}
                            {isPending && <AlertCircle className="h-4 w-4" />}
                            
                            <span className="flex-1">{step.name}</span>
                            <span className="text-xs">{step.duration}</span>
                            
                            {step.automated && (
                              <Badge variant="outline" className="text-xs">Auto</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Executions */}
                  {executions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Recent Executions</h4>
                      <div className="space-y-1">
                        {executions
                          .filter(exec => exec.workflow_id === workflow.id)
                          .slice(0, 3)
                          .map((execution) => (
                            <div key={execution.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                              <span>{execution.step_name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {execution.status}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {format(new Date(execution.created_at), 'MMM dd, HH:mm')}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {workflows.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No workflows found for the selected project
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          Please select a project to view its workflows
        </div>
      )}
    </div>
  );
};
