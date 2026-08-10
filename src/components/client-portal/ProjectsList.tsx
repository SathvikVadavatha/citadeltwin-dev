
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { MoreHorizontal, Pencil, MessageSquare, CheckCircle, Trash2, Loader2, RotateCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  ClientPortalProject,
  ClientPortalProjectResults,
  NewClientPortalProject,
  UpdateClientPortalProject,
} from '@/hooks/useClientPortalProjects';
import { BUILDING_TYPES } from './buildingTypeOptions';
import { AddProjectModal } from './AddProjectModal';
import { ProjectResultsModal } from './ProjectResultsModal';

interface ProjectsListProps {
  projects: ClientPortalProject[];
  loading: boolean;
  resultsByProjectId: Record<string, ClientPortalProjectResults>;
  onUpdate: (id: string, input: UpdateClientPortalProject) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRetryAnalysis: (project: ClientPortalProject) => Promise<void>;
}

const getBuildingTypeLabel = (value: string | null) =>
  BUILDING_TYPES.find((t) => t.value === value)?.label || value || '—';

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'in_progress':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: string) =>
  status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  loading,
  resultsByProjectId,
  onUpdate,
  onDelete,
  onRetryAnalysis,
}) => {
  const { toast } = useToast();
  const [editingProject, setEditingProject] = useState<ClientPortalProject | null>(null);
  const [feedbackProject, setFeedbackProject] = useState<ClientPortalProject | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [approvingProject, setApprovingProject] = useState<ClientPortalProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<ClientPortalProject | null>(null);
  const [viewingResultsProject, setViewingResultsProject] = useState<ClientPortalProject | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const openFeedbackDialog = (project: ClientPortalProject) => {
    setFeedbackProject(project);
    setFeedbackText(project.feedback ?? '');
  };

  const handleEditSubmit = async (input: NewClientPortalProject) => {
    if (!editingProject) return;
    await onUpdate(editingProject.id, input);
  };

  const handleRetry = async (project: ClientPortalProject) => {
    setRetryingId(project.id);
    try {
      await onRetryAnalysis(project);
    } catch (error) {
      toast({
        title: 'Retry failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedbackProject) return;
    setSavingFeedback(true);
    try {
      await onUpdate(feedbackProject.id, { feedback: feedbackText.trim() || null });
      toast({ title: 'Feedback saved', description: `Feedback for "${feedbackProject.project_name}" was updated.` });
      setFeedbackProject(null);
    } catch (error) {
      toast({
        title: 'Failed to save feedback',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleApprove = async (project: ClientPortalProject) => {
    try {
      await onUpdate(project.id, { status: 'approved' });
      toast({ title: 'Project approved', description: `"${project.project_name}" is now approved.` });
    } catch (error) {
      toast({
        title: 'Failed to approve project',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setApprovingProject(null);
    }
  };

  const handleDelete = async (project: ClientPortalProject) => {
    try {
      await onDelete(project.id);
      toast({ title: 'Project deleted', description: `"${project.project_name}" was removed.` });
    } catch (error) {
      toast({
        title: 'Failed to delete project',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingProject(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p>Click "Add New Project" to create one</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Building Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const analysis = resultsByProjectId[project.id];
              // A missing results row means analysis hasn't been kicked off yet (or the
              // hook is about to auto-heal it) — visually indistinguishable from "running".
              const status = analysis?.processing_status ?? 'running';
              const isRetrying = retryingId === project.id;
              const isClickable = status === 'complete';

              return (
              <TableRow
                key={project.id}
                className={isClickable ? 'cursor-pointer hover:bg-muted/50' : ''}
                onClick={() => {
                  if (isClickable) setViewingResultsProject(project);
                }}
              >
                <TableCell className="font-medium">
                  {status === 'complete' ? (
                    <span className="hover:underline underline-offset-2">{project.project_name}</span>
                  ) : status === 'failed' ? (
                    <div className="flex items-center gap-2">
                      <span>{project.project_name}</span>
                      <Badge variant="outline" className="text-destructive border-destructive/40">
                        Analysis failed
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        disabled={isRetrying}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry(project);
                        }}
                      >
                        {isRetrying ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RotateCw className="h-3 w-3 mr-1" />
                        )}
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{project.project_name}</span>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">Processing…</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{project.client_name}</TableCell>
                <TableCell className="text-muted-foreground">{getBuildingTypeLabel(project.building_type)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(project.status)}>{getStatusLabel(project.status)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(project.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingResultsProject(project)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingProject(project)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openFeedbackDialog(project)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {project.feedback ? 'Edit feedback' : 'Add feedback'}
                      </DropdownMenuItem>
                      {project.status !== 'approved' && (
                        <DropdownMenuItem onClick={() => setApprovingProject(project)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Change status to Approved
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingProject(project)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AddProjectModal
        open={!!editingProject}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        onSubmit={handleEditSubmit}
      />

      <Dialog
        open={!!feedbackProject}
        onOpenChange={(open) => {
          if (!open) setFeedbackProject(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback</DialogTitle>
            <DialogDescription>
              {feedbackProject ? `Write or update the feedback note for "${feedbackProject.project_name}".` : ''}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Add a feedback note..."
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackProject(null)} disabled={savingFeedback}>
              Cancel
            </Button>
            <Button onClick={handleSaveFeedback} disabled={savingFeedback}>
              {savingFeedback && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!approvingProject}
        onOpenChange={(open) => {
          if (!open) setApprovingProject(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this project?</AlertDialogTitle>
            <AlertDialogDescription>
              {approvingProject
                ? `"${approvingProject.project_name}" will move to Approved and leave In Progress and Feedback.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => approvingProject && handleApprove(approvingProject)}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => {
          if (!open) setDeletingProject(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingProject
                ? `"${deletingProject.project_name}" will be permanently deleted. This can't be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProject && handleDelete(deletingProject)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProjectResultsModal
        open={!!viewingResultsProject}
        onOpenChange={(open) => {
          if (!open) setViewingResultsProject(null);
        }}
        project={
          viewingResultsProject
            ? projects.find((p) => p.id === viewingResultsProject.id) ?? viewingResultsProject
            : null
        }
        results={viewingResultsProject ? resultsByProjectId[viewingResultsProject.id] : undefined}
        onApprove={() => viewingResultsProject && setApprovingProject(viewingResultsProject)}
      />
    </>
  );
};
