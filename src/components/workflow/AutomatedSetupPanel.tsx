
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBuildingTemplates } from '@/hooks/useBuildingTemplates';
import { useProjects } from '@/hooks/useProjects';
import { Plus, Settings, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { format } from 'date-fns';

export const AutomatedSetupPanel: React.FC = () => {
  const { projectSetups, templates, createAutomatedSetup, isLoading } = useBuildingTemplates();
  const { projects } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'running':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const handleCreateSetup = async () => {
    if (!selectedProject || !selectedTemplate) return;

    try {
      await createAutomatedSetup.mutateAsync({
        project_id: selectedProject,
        template_id: selectedTemplate,
        setup_parameters: {},
        status: 'pending',
        progress_percentage: 0,
        steps_completed: [],
        error_logs: [],
      });
      
      setShowCreateModal(false);
      setSelectedProject('');
      setSelectedTemplate('');
    } catch (error) {
      console.error('Failed to create automated setup:', error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading automated setups...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Automated Project Setups</h3>
          <p className="text-sm text-muted-foreground">
            Automatically configure projects based on building type templates
          </p>
        </div>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Setup
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Automated Project Setup</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Building Template</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a building template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSetup}
                  disabled={!selectedProject || !selectedTemplate || createAutomatedSetup.isPending}
                >
                  {createAutomatedSetup.isPending ? 'Creating...' : 'Create Setup'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Setup List */}
      <div className="space-y-4">
        {projectSetups.map((setup) => {
          const project = projects.find(p => p.id === setup.project_id);
          const template = templates.find(t => t.id === setup.template_id);

          return (
            <Card key={setup.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(setup.status)}
                      {project?.name || 'Unknown Project'}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(setup.status)}>
                        {setup.status}
                      </Badge>
                      <Badge variant="outline">
                        {template?.name || 'Unknown Template'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(setup.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Setup Progress</span>
                    <span>{setup.progress_percentage}%</span>
                  </div>
                  <Progress value={setup.progress_percentage} className="h-2" />
                </div>

                {/* Template Details */}
                {template && (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Building Type:</span> {template.building_type}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Category:</span> {template.category}
                    </div>
                  </div>
                )}

                {/* Steps Completed */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Completed Steps</span>
                  <div className="text-sm text-muted-foreground">
                    {setup.steps_completed.length} of {Object.keys(setup.setup_parameters).length || 5} steps completed
                  </div>
                </div>

                {/* Error Logs */}
                {setup.error_logs.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-red-600">Errors</span>
                    <div className="text-xs bg-red-50 p-2 rounded text-red-700">
                      {setup.error_logs.length} error(s) detected
                    </div>
                  </div>
                )}

                {/* Timing Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {setup.started_at && (
                    <div>
                      <span className="font-medium">Started:</span>{' '}
                      {format(new Date(setup.started_at), 'MMM dd, HH:mm')}
                    </div>
                  )}
                  {setup.completed_at && (
                    <div>
                      <span className="font-medium">Completed:</span>{' '}
                      {format(new Date(setup.completed_at), 'MMM dd, HH:mm')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {setup.status === 'failed' && (
                    <Button size="sm" variant="outline">
                      Retry
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projectSetups.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No automated project setups found. Create your first automated setup to get started.
        </div>
      )}
    </div>
  );
};
