
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderOpen,
  GitBranch,
  Users,
  Calculator,
  FileText,
  History
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useBIMElements } from '@/hooks/useBIMElements';
import { BIMElementsManager } from '@/components/bim/BIMElementsManager';
import { VersionControlPanel } from '@/components/version-control/VersionControlPanel';
import { ProjectHeader } from './ProjectHeader';
import { ProjectStats } from './ProjectStats';
import { ProjectCollaborationTab } from './ProjectCollaborationTab';
import { ProjectAnalysisTab } from './ProjectAnalysisTab';
import { ProjectDocumentsTab } from './ProjectDocumentsTab';
import { ProjectHistoryTab } from './ProjectHistoryTab';

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
      <ProjectHeader project={project} onNavigateBack={onNavigateBack} />
      <ProjectStats project={project} elementsCount={elements.length} />

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
          <ProjectCollaborationTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <ProjectAnalysisTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <ProjectDocumentsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ProjectHistoryTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
