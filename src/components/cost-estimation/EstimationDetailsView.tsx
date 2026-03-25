
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Download, 
  Calculator,
  Package,
  Clock,
  DollarSign
} from 'lucide-react';
import { useCostEstimation } from '@/hooks/useCostEstimation';
import { LineItemsTable } from './LineItemsTable';
import { CostBreakdownChart } from './CostBreakdownChart';
import { QuantityTakeoffPanel } from './QuantityTakeoffPanel';
import { AddLineItemModal } from './AddLineItemModal';
import type { CostEstimation, CostLineItem } from '@/types/cost-estimation';

interface EstimationDetailsViewProps {
  estimation: CostEstimation;
  lineItems: CostLineItem[];
  onBack: () => void;
}

export const EstimationDetailsView = ({ estimation, lineItems, onBack }: EstimationDetailsViewProps) => {
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [activeTab, setActiveTab] = useState('line-items');
  
  const { addLineItem, updateLineItem, deleteLineItem, calculateCostSummary } = useCostEstimation();
  
  const costSummary = calculateCostSummary(lineItems, estimation);

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500/20 text-muted-foreground border-gray-400/50',
      in_progress: 'bg-blue-500/20 text-blue-600 border-blue-600/50',
      completed: 'bg-green-500/20 text-green-600 border-green-600/50',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/50',
      rejected: 'bg-red-500/20 text-destructive border-destructive/50',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="skeuo-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold shadow-sm">{estimation.name}</h2>
            <div className="flex items-center space-x-4 mt-1">
              <Badge className={getStatusColor(estimation.status)}>
                {estimation.status.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {new Date(estimation.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="skeuo-button">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddLineItem(true)} className="skeuo-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Line Item
          </Button>
        </div>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold shadow-sm">
              ${costSummary.totalCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Including markup & contingency
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Line Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lineItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Total items
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labor Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costSummary.totalLaborHours.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated total hours
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costSummary.estimatedDuration}</div>
            <p className="text-xs text-muted-foreground">
              Days (8hr/day)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="line-items" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Line Items
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Cost Breakdown
          </TabsTrigger>
          <TabsTrigger value="takeoffs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Quantity Takeoffs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="line-items">
          <LineItemsTable
            lineItems={lineItems}
            onUpdateLineItem={updateLineItem}
            onDeleteLineItem={deleteLineItem}
            costSummary={costSummary}
          />
        </TabsContent>

        <TabsContent value="breakdown">
          <CostBreakdownChart lineItems={lineItems} costSummary={costSummary} />
        </TabsContent>

        <TabsContent value="takeoffs">
          <QuantityTakeoffPanel estimationId={estimation.id} />
        </TabsContent>
      </Tabs>

      <AddLineItemModal
        open={showAddLineItem}
        onClose={() => setShowAddLineItem(false)}
        onSubmit={addLineItem}
        estimationId={estimation.id}
      />
    </div>
  );
};
