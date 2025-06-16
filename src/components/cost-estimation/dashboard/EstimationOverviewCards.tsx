
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calculator, Clock, TrendingUp } from 'lucide-react';
import type { CostEstimation } from '@/types/cost-estimation';

interface EstimationOverviewCardsProps {
  estimations: CostEstimation[];
}

export const EstimationOverviewCards = ({ estimations }: EstimationOverviewCardsProps) => {
  const totalProjectCost = estimations.reduce((sum, est) => sum + (est.total_estimated_cost || 0), 0);
  const completedEstimations = estimations.filter(est => est.status === 'completed' || est.status === 'approved').length;
  const avgDuration = estimations.length > 0 
    ? Math.round(estimations.reduce((sum, est) => sum + (est.estimated_duration_days || 0), 0) / estimations.length) 
    : 0;

  return (
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
            {avgDuration} days
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
  );
};
