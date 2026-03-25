
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { Project } from '@/hooks/useProjects';

interface ProjectListItemProps {
  project: Project;
  onClick: () => void;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "active": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "completed": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "archived": return "bg-gray-500/10 text-muted-foreground border-gray-500/20";
    default: return "bg-gray-500/10 text-muted-foreground border-gray-500/20";
  }
};

const getProjectTypeColor = (type?: string) => {
  switch (type) {
    case "residential": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "commercial": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "industrial": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "infrastructure": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    default: return "bg-gray-500/10 text-muted-foreground border-gray-500/20";
  }
};

export const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, onClick }) => {
  return (
    <div 
      className="p-6 hover:bg-secondary/10 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
            <Badge className={getStatusColor(project.status)}>
              {project.status || 'active'}
            </Badge>
            <Badge className={getProjectTypeColor(project.project_type)}>
              {project.project_type || 'general'}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.description || "No description provided"}</p>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Created {format(new Date(project.created_at), "MMM d, yyyy")}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Updated {format(new Date(project.updated_at), "MMM d, yyyy")}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
