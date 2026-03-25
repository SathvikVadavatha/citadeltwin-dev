
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Plus } from 'lucide-react';
import type { CostEstimation } from '@/types/cost-estimation';

interface EstimationsListProps {
  estimations: CostEstimation[];
  onCreateNew: () => void;
  onSelectEstimation: (estimation: CostEstimation) => void;
}

export const EstimationsList = ({ estimations, onCreateNew, onSelectEstimation }: EstimationsListProps) => {
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

  if (estimations.length === 0) {
    return (
      <Card className="gradient-border">
        <CardContent className="p-8 text-center">
          <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Cost Estimations</h3>
          <p className="text-muted-foreground mb-4">
            Create your first cost estimation to get started with project budgeting.
          </p>
          <Button onClick={onCreateNew} className="skeuo-button">
            <Plus className="w-4 h-4 mr-2" />
            Create Estimation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {estimations.map((estimation) => (
        <Card 
          key={estimation.id} 
          className="gradient-border cursor-pointer hover:shadow-sm transition-all"
          onClick={() => onSelectEstimation(estimation)}
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
                <p className="font-medium text-lg shadow-sm">
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
  );
};
