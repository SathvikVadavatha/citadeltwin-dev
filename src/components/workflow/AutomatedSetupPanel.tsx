
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBuildingTemplates } from '@/hooks/useBuildingTemplates';
import { Settings, Play, CheckCircle, AlertCircle } from 'lucide-react';

export const AutomatedSetupPanel: React.FC = () => {
  const { projectSetups, isLoading, createAutomatedSetup } = useBuildingTemplates();

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'running':
        return <Settings className="h-4 w-4 animate-spin" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading automated setups...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Setup Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Create New Automated Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Automated project setup will configure your project based on building type templates,
            including compliance checks, materials, and standard elements.
          </div>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Start New Setup
          </Button>
        </CardContent>
      </Card>

      {/* Active Setups */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Automated Setups</h3>
        
        {projectSetups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No automated setups found. Create your first automated project setup to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectSetups.map((setup) => (
              <Card key={setup.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-base">
                        Setup #{setup.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(setup.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(setup.status)}
                            {setup.status.toUpperCase()}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{setup.progress_percentage}%</span>
                    </div>
                    <Progress value={setup.progress_percentage} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Steps Completed:</div>
                    <div className="text-xs space-y-1">
                      {setup.steps_completed.length > 0 ? (
                        setup.steps_completed.slice(0, 3).map((step, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-muted-foreground">{step}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground">No steps completed yet</div>
                      )}
                      {setup.steps_completed.length > 3 && (
                        <div className="text-muted-foreground text-xs">
                          +{setup.steps_completed.length - 3} more steps
                        </div>
                      )}
                    </div>
                  </div>

                  {setup.error_logs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-red-600">Errors:</div>
                      <div className="text-xs text-red-600">
                        {setup.error_logs.slice(0, 2).join(', ')}
                        {setup.error_logs.length > 2 && '...'}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    {setup.status === 'failed' && (
                      <Button size="sm" variant="outline">
                        Retry
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
