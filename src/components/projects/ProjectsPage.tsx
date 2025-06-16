
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Brain } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectFilters } from './ProjectFilters';
import { ProjectCard } from './ProjectCard';
import { ProjectListItem } from './ProjectListItem';

interface ProjectsPageProps {
  onNavigate: (view: string, projectId?: string) => void;
}

export const ProjectsPage = ({ onNavigate }: ProjectsPageProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { projects, loading } = useProjects();

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === "all" || (project.status && project.status === filterStatus);
    const matchesType = filterType === "all" || (project.project_type && project.project_type === filterType);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleProjectCreated = (project: any) => {
    onNavigate('project-details', project.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your civil engineering projects and digital twins
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onNavigate('ai-service')}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            AI Services
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <ProjectFilters
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        filterType={filterType}
        viewMode={viewMode}
        onSearchChange={setSearchTerm}
        onStatusChange={setFilterStatus}
        onTypeChange={setFilterType}
        onViewModeChange={setViewMode}
      />

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <Card className="glass-effect">
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {projects.length === 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="mb-4">Create your first project to get started</p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-2">No projects match your filters</h3>
                  <p>Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onNavigate('project-details', project.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="glass-effect">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredProjects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  onClick={() => onNavigate('project-details', project.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
