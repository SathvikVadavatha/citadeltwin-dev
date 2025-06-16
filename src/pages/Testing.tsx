
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestingFramework } from '@/components/testing/TestingFramework';
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import { RenderingAnalysisDashboard } from '@/components/performance/RenderingAnalysisDashboard';
import { Activity, TestTube, Zap } from 'lucide-react';

export const Testing: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Testing & Performance
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing framework, performance optimization, and rendering analysis tools
          </p>
        </div>

        <Tabs defaultValue="testing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Testing Framework
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Dashboard
            </TabsTrigger>
            <TabsTrigger value="rendering" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Rendering Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="testing" className="space-y-4">
            <TestingFramework />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceDashboard />
          </TabsContent>

          <TabsContent value="rendering" className="space-y-4">
            <RenderingAnalysisDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
