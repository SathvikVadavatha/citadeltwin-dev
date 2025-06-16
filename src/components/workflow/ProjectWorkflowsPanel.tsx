
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProjectWorkflows } from '@/hooks/useProjectWorkflows';
import { Play, Pause, Square, MoreHorizontal } from 'lucide-react';

export const ProjectWorkflowsPanel: React.FC = () => {
  const { workflows, isLoading, pauseWorkflow, resumeWorkflow, executeStep } = useProjectWorkflows();

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateProgress = (currentStep: number, totalSteps: number) => {
    if (totalSteps === 0) return 0;
    return Math.round((currentStep / totalSteps) * 100);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading workflows...</div>;
  }

  return (
    <div className="space-y-4">
      {workflows.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No workflows found. Create a new workflow to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => {
            const progress = calculateProgress(workflow.current_step, workflow.steps.length);
            
            return (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status.toUpperCase()}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{workflow.current_step} of {workflow.steps.length} steps</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">
                      {progress}% complete
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Current Step:</div>
                    <div className="text-sm text-muted-foreground">
                      {workflow.current_step < workflow.steps.length 
                        ? workflow.steps[workflow.current_step]?.name || 'Unknown step'
                        : 'Completed'
                      }
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {workflow.status === 'active' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => pauseWorkflow.mutate(workflow.id)}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => executeStep.mutate({
                            workflowId: workflow.id,
                            stepIndex: workflow.current_step
                          })}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Execute
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
                    
                    {workflow.status === 'completed' && (
                      <Badge variant="outline" className="text-green-600">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
