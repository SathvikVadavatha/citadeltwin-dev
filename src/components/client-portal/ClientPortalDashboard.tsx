
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { ProjectsList } from './ProjectsList';
import { AddProjectModal } from './AddProjectModal';
import { useClientPortalProjects, ClientPortalProjectResults } from '@/hooks/useClientPortalProjects';

export const ClientPortalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const {
    projects,
    projectResults,
    loading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
    retryAnalysis,
  } = useClientPortalProjects();

  const resultsByProjectId = useMemo(
    () =>
      projectResults.reduce<Record<string, ClientPortalProjectResults>>((acc, result) => {
        acc[result.project_id] = result;
        return acc;
      }, {}),
    [projectResults]
  );

  const inProgressProjects = useMemo(
    () => projects.filter((p) => p.status === 'in_progress'),
    [projects]
  );
  const approvedProjects = useMemo(
    () => projects.filter((p) => p.status === 'approved'),
    [projects]
  );
  const feedbackProjects = useMemo(
    () => inProgressProjects.filter((p) => !!p.feedback && p.feedback.trim().length > 0),
    [inProgressProjects]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Portal</h1>
          <p className="text-muted-foreground mt-1">
            View projects, provide feedback, and track progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAddProjectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Project
          </Button>
        </div>
      </div>

      <AddProjectModal open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen} onSubmit={createProject} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{inProgressProjects.length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{approvedProjects.length}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{feedbackProjects.length}</div>
                <div className="text-sm text-muted-foreground">Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            In Progress
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <ProjectsList
            projects={projects}
            loading={projectsLoading}
            resultsByProjectId={resultsByProjectId}
            onUpdate={updateProject}
            onDelete={deleteProject}
            onRetryAnalysis={retryAnalysis}
          />
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <ProjectsList
            projects={inProgressProjects}
            loading={projectsLoading}
            resultsByProjectId={resultsByProjectId}
            onUpdate={updateProject}
            onDelete={deleteProject}
            onRetryAnalysis={retryAnalysis}
          />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <ProjectsList
            projects={approvedProjects}
            loading={projectsLoading}
            resultsByProjectId={resultsByProjectId}
            onUpdate={updateProject}
            onDelete={deleteProject}
            onRetryAnalysis={retryAnalysis}
          />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <ProjectsList
            projects={feedbackProjects}
            loading={projectsLoading}
            resultsByProjectId={resultsByProjectId}
            onUpdate={updateProject}
            onDelete={deleteProject}
            onRetryAnalysis={retryAnalysis}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
