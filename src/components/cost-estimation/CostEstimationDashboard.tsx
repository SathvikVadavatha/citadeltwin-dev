
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calculator, 
  Clock, 
  TrendingUp,
  Plus,
  FileText,
  BarChart3
} from 'lucide-react';
import { useCostEstimation } from '@/hooks/useCostEstimation';
import { CreateEstimationModal } from './CreateEstimationModal';
import { EstimationDetailsView } from './EstimationDetailsView';
import { CostSummaryCard } from './CostSummaryCard';
import { BudgetTrackingPanel } from './BudgetTrackingPanel';

interface CostEstimationDashboardProps {
  projectId: string;
}

export const CostEstimationDashboard = ({ projectId }: CostEstimationDashboardProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('estimations');
  
  const {
    estimations,
    currentEstimation,
    setCurrentEstimation,
    lineItems,
    loading,
    createEstimation,
    calculateCostSummary,
  } = useCostEstimation(projectId);

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-400/50',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      completed: 'bg-green-500/20 text-green-400 border-green-400/50',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/50',
      rejected: 'bg-red-500/20 text-red-400 border-red-400/50',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading cost estimations...</p>
        </div>
      </div>
    );
  }

  if (currentEstimation) {
    return (
      <EstimationDetailsView
        estimation={currentEstimation}
        lineItems={lineItems}
        onBack={() => setCurrentEstimation(null)}
      />
    );
  }

  const totalProjectCost = estimations.reduce((sum, est) => sum + (est.total_estimated_cost || 0), 0);
  const completedEstimations = estimations.filter(est => est.status === 'completed' || est.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold glow-cyan">Cost Estimation</h2>
          <p className="text-muted-foreground">
            Manage project cost estimations and budget tracking
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="cyber-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Estimation
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Project Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold glow-cyan">
              ${totalProjectCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimations</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimations.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedEstimations} completed
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(estimations.reduce((sum, est) => sum + (est.estimated_duration_days || 0), 0) / estimations.length || 0)} days
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground">
              Est. vs actual costs
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="estimations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="w-4 h-4 mr-2" />
            Estimations
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="w-4 h-4 mr-2" />
            Budget Tracking
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="w-4 h-4 mr-2" />
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estimations" className="space-y-4">
          {estimations.length === 0 ? (
            <Card className="gradient-border">
              <CardContent className="p-8 text-center">
                <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Cost Estimations</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first cost estimation to get started with project budgeting.
                </p>
                <Button onClick={() => setShowCreateModal(true)} className="cyber-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Estimation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {estimations.map((estimation) => (
                <Card 
                  key={estimation.id} 
                  className="gradient-border cursor-pointer hover:glow-cyan transition-all"
                  onClick={() => setCurrentEstimation(estimation)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{estimation.name}</CardTitle>
                        {estimation.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {estimation.description}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(estimation.status)}>
                        {estimation.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Cost:</span>
                        <p className="font-medium text-lg glow-cyan">
                          ${estimation.total_estimated_cost?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium">
                          {estimation.estimated_duration_days || 0} days
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Markup:</span>
                        <p className="font-medium">
                          {estimation.markup_percentage}%
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <p className="font-medium">
                          {new Date(estimation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTrackingPanel projectId={projectId} estimations={estimations} />
        </TabsContent>

        <TabsContent value="summary">
          <CostSummaryCard estimations={estimations} />
        </TabsContent>
      </Tabs>

      <CreateEstimationModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createEstimation}
        projectId={projectId}
      />
    </div>
  );
};
