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
import {
  useClientPortalProjects,
  ClientPortalProject,
  ClientPortalProjectResults,
  NewClientPortalProject,
} from '@/hooks/useClientPortalProjects';

export const ClientPortalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [requestedResultsProject, setRequestedResultsProject] = useState<ClientPortalProject | null>(null);
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

  const handleCreateProject = async (input: NewClientPortalProject, file?: File) => {
    const createdProject = await createProject(input, file);
    setActiveTab('projects');
    setRequestedResultsProject(createdProject);
  };

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Portal</h1>
          <p className="text-muted-foreground mt-1">
            View projects, provide feedback, and track progress
          </p>
        </div>

        <div className="flex justify-center pt-5">
          <div className="rounded-2xl border-2 border-white bg-white p-2 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/20">
            <Button
              size="lg"
              onClick={() => setIsAddProjectOpen(true)}
              className="h-14 min-w-[280px] rounded-xl border border-primary-foreground/20 px-10 text-base font-semibold shadow-md shadow-primary/25 transition-all duration-200 hover:brightness-105"
            >
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15">
                <Plus className="h-5 w-5" />
              </span>
              Add New Project
            </Button>
          </div>
        </div>
      </div>

      <AddProjectModal
        open={isAddProjectOpen}
        onOpenChange={setIsAddProjectOpen}
        onSubmit={handleCreateProject}
      />

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
            requestedResultsProject={requestedResultsProject}
            onResultsProjectOpenRequestHandled={() => setRequestedResultsProject(null)}
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
