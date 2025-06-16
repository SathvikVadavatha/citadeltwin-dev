
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Details</h1>
          <p className="text-muted-foreground">Project ID: {projectId}</p>
        </div>
        <Badge variant="outline">Active</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>
            Detailed information about this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Project details will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails;
