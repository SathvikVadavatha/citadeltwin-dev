
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Share, Download } from 'lucide-react';
import { Project } from '@/hooks/useProjects';

interface ProjectHeaderProps {
  project: Project;
  onNavigateBack: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, onNavigateBack }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onNavigateBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.description || 'No description provided'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};
