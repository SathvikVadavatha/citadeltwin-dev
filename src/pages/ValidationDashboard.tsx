
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowValidationPanel } from '@/components/workflow/WorkflowValidationPanel';
import { ComponentIntegrationTester } from '@/components/integration/ComponentIntegrationTester';
import { PerformanceValidationDashboard } from '@/components/performance/PerformanceValidationDashboard';
import { 
  BarChart3, 
  Settings, 
  Database,
  CheckCircle
} from 'lucide-react';

export const ValidationDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Validation Dashboard</h1>
          <p className="text-muted-foreground">
            Phase 3: Integration & Testing - Comprehensive validation of all system components
          </p>
        </div>

        <Tabs defaultValue="workflow" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Workflow Testing
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Component Integration
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Performance Validation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="space-y-6">
            <WorkflowValidationPanel />
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <ComponentIntegrationTester />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceValidationDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
