
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Project } from '@/hooks/useProjects';

interface ProjectStatsProps {
  project: Project;
  elementsCount: number;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ project, elementsCount }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{elementsCount}</div>
            <div className="text-sm text-muted-foreground">BIM Elements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {format(new Date(project.created_at), 'MMM d')}
            </div>
            <div className="text-sm text-muted-foreground">Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {format(new Date(project.updated_at), 'MMM d')}
            </div>
            <div className="text-sm text-muted-foreground">Last Updated</div>
          </div>
          <div className="text-center">
            <Badge variant="secondary" className="w-full justify-center">
              Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
