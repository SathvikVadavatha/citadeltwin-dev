
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Plus, Trash2, Eye, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useFEAAnalyses } from "@/hooks/useFEAAnalyses";
import { CreateFEAAnalysisModal } from "./CreateFEAAnalysisModal";
import { FEAResultsViewer } from "./FEAResultsViewer";
import { FEALoadsManager } from "./FEALoadsManager";
import { FEABoundaryConditionsManager } from "./FEABoundaryConditionsManager";

interface FEAAnalysisManagerProps {
  elementId?: string;
}

export const FEAAnalysisManager = ({ elementId }: FEAAnalysisManagerProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analyses");

  const {
    analyses,
    loads,
    boundaryConditions,
    results,
    loading,
    running,
    createAnalysis,
    runAnalysis,
    deleteAnalysis,
    fetchAnalysisData,
  } = useFEAAnalyses(elementId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const handleAnalysisSelect = (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    fetchAnalysisData(analysisId);
  };

  const handleRunAnalysis = async (analysisId: string) => {
    await runAnalysis(analysisId);
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      await deleteAnalysis(analysisId);
      if (selectedAnalysisId === analysisId) {
        setSelectedAnalysisId(null);
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading FEA analyses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-300">FEA Analysis</h2>
          <p className="text-gray-400">Finite Element Analysis for structural calculations</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="analyses" className="data-[state=active]:bg-cyan-600">
            Analyses
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-cyan-600" disabled={!selectedAnalysisId}>
            Results & Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="space-y-4">
          <div className="grid gap-4">
            {analyses.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-400 text-center">
                    No FEA analyses found. Create your first analysis to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              analyses.map((analysis) => (
                <Card 
                  key={analysis.id}
                  className={`bg-gray-900 border-gray-700 cursor-pointer transition-colors ${
                    selectedAnalysisId === analysis.id ? 'border-cyan-500' : 'hover:border-gray-600'
                  }`}
                  onClick={() => handleAnalysisSelect(analysis.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-cyan-300">{analysis.name}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {analysis.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(analysis.status)}
                        <Badge variant="outline" className="capitalize">
                          {analysis.analysis_type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Created: {new Date(analysis.created_at).toLocaleDateString()}
                        {analysis.completed_at && (
                          <span className="ml-4">
                            Completed: {new Date(analysis.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalysisSelect(analysis.id);
                            setActiveTab("results");
                          }}
                          className="border-cyan-600 text-cyan-300 hover:bg-cyan-600/20"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunAnalysis(analysis.id);
                          }}
                          disabled={running || analysis.status === 'running'}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnalysis(analysis.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {selectedAnalysisId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FEALoadsManager 
                  analysisId={selectedAnalysisId} 
                  loads={loads}
                  onRefresh={() => fetchAnalysisData(selectedAnalysisId)}
                />
                <FEABoundaryConditionsManager 
                  analysisId={selectedAnalysisId}
                  boundaryConditions={boundaryConditions}
                  onRefresh={() => fetchAnalysisData(selectedAnalysisId)}
                />
              </div>
              <div>
                <FEAResultsViewer 
                  analysisId={selectedAnalysisId}
                  results={results}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateFEAAnalysisModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAnalysis={createAnalysis}
        elementId={elementId}
      />
    </div>
  );
};
