
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectCollaborationTabProps {
  projectId: string;
}

export const ProjectCollaborationTab: React.FC<ProjectCollaborationTabProps> = ({ projectId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Collaboration</CardTitle>
        <CardDescription>
          Manage team access and real-time collaboration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Collaboration features coming soon...</p>
      </CardContent>
    </Card>
  );
};
