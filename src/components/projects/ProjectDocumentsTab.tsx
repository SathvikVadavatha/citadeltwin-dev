
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectDocumentsTabProps {
  projectId: string;
}

export const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = ({ projectId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Documents</CardTitle>
        <CardDescription>
          Generate and manage project documentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Document management coming soon...</p>
      </CardContent>
    </Card>
  );
};
