
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useProjectProgress } from '@/hooks/useProjectProgress';

export const ProgressTracker: React.FC = () => {
  const { projects, loading } = useProjectProgress();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'on_hold': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">No project progress data</h3>
              <p>Progress tracking will appear here once projects are shared with you</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        projects.map((project: any) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusIcon(project.status)}
                  <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="w-full" />
              </div>
              
              {/* Project Milestones */}
              <div className="space-y-3">
                <h4 className="font-medium">Project Milestones</h4>
                {project.milestones?.map((milestone: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded">
                    <div className={`w-3 h-3 rounded-full ${
                      milestone.completed ? 'bg-green-500' : 
                      milestone.current ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{milestone.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {milestone.due_date && (
                          <>Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}</>
                        )}
                      </div>
                    </div>
                    {milestone.completed && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>

              {/* Recent Updates */}
              {project.recent_updates && project.recent_updates.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Recent Updates</h4>
                  {project.recent_updates.slice(0, 3).map((update: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded text-sm">
                      <div className="font-medium">{update.title}</div>
                      <div className="text-muted-foreground mt-1">{update.description}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
