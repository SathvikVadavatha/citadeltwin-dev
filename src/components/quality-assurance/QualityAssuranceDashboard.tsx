
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, TestTube, DollarSign, Shield, TrendingUp, Settings } from 'lucide-react';
import { ModelHealthChecker } from './ModelHealthChecker';
import { CalculationTestRunner } from './CalculationTestRunner';
import { CostValidationDashboard } from './CostValidationDashboard';
import { SystemDiagnosticsPanel } from './SystemDiagnosticsPanel';

interface QualityAssuranceDashboardProps {
  projectId: string;
}

export const QualityAssuranceDashboard = ({ projectId }: QualityAssuranceDashboardProps) => {
  const [selectedTab, setSelectedTab] = useState('health');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold glow-cyan">Quality Assurance & Testing</h2>
          <p className="text-muted-foreground">
            Comprehensive model validation, testing, and quality control
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-400/50">
          <Shield className="w-4 h-4 mr-1" />
          QA Suite
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Model Health</p>
                <p className="font-medium">Validation System</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TestTube className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Automated Testing</p>
                <p className="font-medium">Calculation Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cost Validation</p>
                <p className="font-medium">Accuracy Checks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className="font-medium">Diagnostics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-cyan-500" />
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className="font-medium">Overall Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main QA Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="health" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="w-4 h-4 mr-2" />
            Model Health
          </TabsTrigger>
          <TabsTrigger value="testing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TestTube className="w-4 h-4 mr-2" />
            Automated Testing
          </TabsTrigger>
          <TabsTrigger value="cost-validation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <DollarSign className="w-4 h-4 mr-2" />
            Cost Validation
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="w-4 h-4 mr-2" />
            System Diagnostics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <ModelHealthChecker />
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <CalculationTestRunner />
        </TabsContent>

        <TabsContent value="cost-validation" className="space-y-4">
          <CostValidationDashboard projectId={projectId} />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <SystemDiagnosticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
