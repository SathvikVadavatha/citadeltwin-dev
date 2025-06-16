
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Zap, 
  Settings,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';
import { RealFEAPanel } from './RealFEAPanel';
import { AdvancedFEAManager } from './AdvancedFEAManager';
import { LoadFEAIntegration } from '@/components/loads/LoadFEAIntegration';
import { useFEAAnalyses } from '@/hooks/useFEAAnalyses';

interface FEAAnalysisManagerProps {
  elementId?: string;
}

export const FEAAnalysisManager: React.FC<FEAAnalysisManagerProps> = ({ elementId }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const { analyses, runAnalysis } = useFEAAnalyses();

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-500" />
            FEA Analysis Center
            <Badge variant="secondary" className="ml-auto">
              {analyses.length} Analyses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Basic FEA
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Advanced FEA
              </TabsTrigger>
              <TabsTrigger value="integration" className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Load Integration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <RealFEAPanel />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <AdvancedFEAManager />
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <LoadFEAIntegration 
                loadResults={null}
                onAnalysisComplete={(results) => {
                  console.log('Analysis completed:', results);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Analysis Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Recent Analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No FEA analyses yet</p>
              <p className="text-sm">Create your first analysis using the tabs above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.slice(0, 5).map((analysis: any) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{analysis.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {analysis.analysis_type} • {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'}>
                      {analysis.status}
                    </Badge>
                    {analysis.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => runAnalysis(analysis.id)}
                        className="cyber-button"
                      >
                        Run
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
