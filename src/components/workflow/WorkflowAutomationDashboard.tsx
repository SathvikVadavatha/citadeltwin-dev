
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowTemplatesPanel } from './WorkflowTemplatesPanel';
import { ProjectWorkflowsPanel } from './ProjectWorkflowsPanel';
import { BuildingTemplatesPanel } from './BuildingTemplatesPanel';
import { AutomatedSetupPanel } from './AutomatedSetupPanel';
import { WorkflowMetricsCards } from './WorkflowMetricsCards';
import { Settings, FileText, Workflow, Building } from 'lucide-react';

export const WorkflowAutomationDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Workflow Automation & Templates</h1>
        <p className="text-muted-foreground">
          Streamline project workflows with automated templates and building type configurations
        </p>
      </div>

      <WorkflowMetricsCards />

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Project Workflows
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Workflow Templates
          </TabsTrigger>
          <TabsTrigger value="building-templates" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Building Templates
          </TabsTrigger>
          <TabsTrigger value="automated-setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Automated Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Active Project Workflows</CardTitle>
              <CardDescription>
                Manage and monitor workflows for your active projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectWorkflowsPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>
                Create and customize workflow templates for different project types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowTemplatesPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="building-templates">
          <Card>
            <CardHeader>
              <CardTitle>Building Type Templates</CardTitle>
              <CardDescription>
                Configure templates for different building types with default parameters and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BuildingTemplatesPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automated-setup">
          <Card>
            <CardHeader>
              <CardTitle>Automated Project Setup</CardTitle>
              <CardDescription>
                Configure automated project initialization based on building type templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutomatedSetupPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
