
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Zap, 
  BarChart3, 
  FileText, 
  Settings,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { DynamicAnalysisPanel } from './DynamicAnalysisPanel';
import { AdvancedMaterialModeler } from './AdvancedMaterialModeler';
import { ComplexLoadingPanel } from './ComplexLoadingPanel';
import { FEAResultsVisualizer } from './FEAResultsVisualizer';
import { FEAReportGenerator } from './FEAReportGenerator';
import { useAdvancedFEA } from '@/hooks/useAdvancedFEA';

export const AdvancedFEAManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  
  const {
    analyses,
    runningAnalyses,
    startAnalysis,
    pauseAnalysis,
    stopAnalysis,
    getAnalysisProgress
  } = useAdvancedFEA();

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-500" />
            Advanced FEA Analysis Suite
            <Badge variant="secondary" className="ml-auto">
              {runningAnalyses.length} Running
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="analysis" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Materials
              </TabsTrigger>
              <TabsTrigger value="loading" className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Loading
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Results
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <DynamicAnalysisPanel 
                selectedAnalysisId={selectedAnalysisId}
                onAnalysisSelect={setSelectedAnalysisId}
              />
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <AdvancedMaterialModeler 
                analysisId={selectedAnalysisId}
              />
            </TabsContent>

            <TabsContent value="loading" className="space-y-4">
              <ComplexLoadingPanel 
                analysisId={selectedAnalysisId}
              />
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <FEAResultsVisualizer 
                analysisId={selectedAnalysisId}
              />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <FEAReportGenerator 
                analysisId={selectedAnalysisId}
              />
            </TabsContent>
          </Tabs>

          {/* Running Analyses Status */}
          {runningAnalyses.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Active Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {runningAnalyses.map((analysis: any) => (
                    <div key={analysis.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{analysis.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {analysis.analysis_type} • {getAnalysisProgress(analysis.id)}% complete
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => pauseAnalysis(analysis.id)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => stopAnalysis(analysis.id)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
