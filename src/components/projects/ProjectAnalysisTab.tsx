
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectAnalysisTabProps {
  projectId: string;
}

export const ProjectAnalysisTab: React.FC<ProjectAnalysisTabProps> = ({ projectId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engineering Analysis</CardTitle>
        <CardDescription>
          Run structural analysis and load calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Analysis tools coming soon...</p>
      </CardContent>
    </Card>
  );
};
