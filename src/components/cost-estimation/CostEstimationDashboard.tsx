
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { useCostEstimation } from '@/hooks/useCostEstimation';
import { CreateEstimationModal } from './CreateEstimationModal';
import { EstimationDetailsView } from './EstimationDetailsView';
import { CostSummaryCard } from './CostSummaryCard';
import { BudgetTrackingPanel } from './BudgetTrackingPanel';
import { EstimationOverviewCards } from './dashboard/EstimationOverviewCards';
import { EstimationsList } from './dashboard/EstimationsList';
import type { CostEstimation } from '@/types/cost-estimation';

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

  const handleCreateEstimation = async (data: Partial<CostEstimation>): Promise<CostEstimation> => {
    const result = await createEstimation(data);
    if (!result) {
      throw new Error('Failed to create estimation');
    }
    return result;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold glow-cyan">Cost Estimation</h2>
          <p className="text-muted-foreground">
            Manage project cost estimations and budget tracking
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="cyber-button">
          <Plus className="w-4 h-4 mr-2" />
          New Estimation
        </Button>
      </div>

      <EstimationOverviewCards estimations={estimations} />

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
          <EstimationsList
            estimations={estimations}
            onCreateNew={() => setShowCreateModal(true)}
            onSelectEstimation={setCurrentEstimation}
          />
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
        onSubmit={handleCreateEstimation}
        projectId={projectId}
      />
    </div>
  );
};
