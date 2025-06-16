
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectHistoryTabProps {
  projectId: string;
}

export const ProjectHistoryTab: React.FC<ProjectHistoryTabProps> = ({ projectId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project History</CardTitle>
        <CardDescription>
          View detailed audit trail and change history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">History tracking coming soon...</p>
      </CardContent>
    </Card>
  );
};
