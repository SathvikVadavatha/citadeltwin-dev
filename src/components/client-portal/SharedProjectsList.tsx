
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare, Download, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SharedProject {
  id: string;
  name: string;
  description: string;
  status: string;
  shared_at: string;
  permissions: {
    can_view: boolean;
    can_comment: boolean;
    can_approve: boolean;
  };
  project_data: any;
}

interface SharedProjectsListProps {
  projects: SharedProject[];
  loading: boolean;
}

export const SharedProjectsList: React.FC<SharedProjectsListProps> = ({
  projects,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">No shared projects</h3>
              <p>You don't have access to any shared projects yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {project.description}
                  </CardDescription>
                </div>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Shared {format(new Date(project.shared_at), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    {project.permissions.can_view && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Badge>
                    )}
                    {project.permissions.can_comment && (
                      <Badge variant="outline" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Comment
                      </Badge>
                    )}
                    {project.permissions.can_approve && (
                      <Badge variant="outline" className="text-xs">
                        Approve
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  {project.permissions.can_comment && (
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
