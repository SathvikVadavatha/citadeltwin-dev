
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Settings, 
  Share, 
  Download,
  FolderOpen,
  History,
  GitBranch,
  Users,
  Calculator,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { useBIMElements } from '@/hooks/useBIMElements';
import { BIMElementsManager } from '@/components/bim/BIMElementsManager';
import { VersionControlPanel } from '@/components/version-control/VersionControlPanel';

interface ProjectDetailsViewProps {
  projectId: string;
  onNavigateBack: () => void;
}

export const ProjectDetailsView = ({ projectId, onNavigateBack }: ProjectDetailsViewProps) => {
  const { projects } = useProjects();
  const { elements } = useBIMElements(projectId, 'project');
  
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Project not found</h3>
          <Button onClick={onNavigateBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Project Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{elements.length}</div>
              <div className="text-sm text-muted-foreground">BIM Elements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {format(new Date(project.created_at), 'MMM d')}
              </div>
              <div className="text-sm text-muted-foreground">Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {format(new Date(project.updated_at), 'MMM d')}
              </div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="w-full justify-center">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="elements" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="elements" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Elements
          </TabsTrigger>
          <TabsTrigger value="version-control" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Version Control
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elements" className="mt-6">
          <BIMElementsManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="version-control" className="mt-6">
          <VersionControlPanel projectId={projectId} />
        </TabsContent>

        <TabsContent value="collaboration" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Collaboration</CardTitle>
              <CardDescription>
                Manage team access and real-time collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Collaboration features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
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
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
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
        </TabsContent>

        <TabsContent value="history" className="mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
