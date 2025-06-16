
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { Project } from '@/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "active": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "completed": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "archived": return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

const getProjectTypeColor = (type?: string) => {
  switch (type) {
    case "residential": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "commercial": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "industrial": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "infrastructure": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <Card 
      className="glass-effect hover-lift cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-foreground">{project.name}</CardTitle>
            <CardDescription className="text-sm">
              {project.description || "No description provided"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(project.status)}>
            {project.status || 'active'}
          </Badge>
          <Badge className={getProjectTypeColor(project.project_type)}>
            {project.project_type || 'general'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Created {format(new Date(project.created_at), "MMM d, yyyy")}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Updated {format(new Date(project.updated_at), "MMM d, yyyy")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
