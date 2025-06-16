
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import type { CostEstimation } from '@/types/cost-estimation';

interface CostSummaryCardProps {
  estimations: CostEstimation[];
}

export const CostSummaryCard = ({ estimations }: CostSummaryCardProps) => {
  const totalProjectCost = estimations.reduce((sum, est) => sum + (est.total_estimated_cost || 0), 0);
  const avgDuration = estimations.length > 0 
    ? estimations.reduce((sum, est) => sum + (est.estimated_duration_days || 0), 0) / estimations.length 
    : 0;
  
  const statusCounts = estimations.reduce((acc, est) => {
    acc[est.status] = (acc[est.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Project Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold glow-cyan">${totalProjectCost.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Project Cost</p>
            </div>
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{avgDuration.toFixed(0)} days</p>
              <p className="text-sm text-muted-foreground">Average Duration</p>
            </div>
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{estimations.length}</p>
              <p className="text-sm text-muted-foreground">Total Estimations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle>Estimation Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="text-center">
                <Badge className={getStatusColor(status)}>
                  {status.replace('_', ' ')}
                </Badge>
                <p className="text-lg font-semibold mt-2">{count}</p>
                <p className="text-xs text-muted-foreground">
                  {((count / estimations.length) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Estimations */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle>Recent Estimations</CardTitle>
        </CardHeader>
        <CardContent>
          {estimations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No estimations created yet.
            </p>
          ) : (
            <div className="space-y-4">
              {estimations.slice(0, 5).map((estimation) => (
                <div
                  key={estimation.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(estimation.status)}>
                      {estimation.status.replace('_', ' ')}
                    </Badge>
                    <div>
                      <p className="font-medium">{estimation.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(estimation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${estimation.total_estimated_cost?.toLocaleString() || '0'}</p>
                    <p className="text-xs text-muted-foreground">
                      {estimation.estimated_duration_days || 0} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Highest Cost:</span>
              <p className="font-medium">
                ${Math.max(...estimations.map(e => e.total_estimated_cost || 0)).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Lowest Cost:</span>
              <p className="font-medium">
                ${Math.min(...estimations.map(e => e.total_estimated_cost || 0)).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Average Cost:</span>
              <p className="font-medium">
                ${estimations.length > 0 ? (totalProjectCost / estimations.length).toLocaleString() : '0'}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Cost Range:</span>
              <p className="font-medium">
                ${(Math.max(...estimations.map(e => e.total_estimated_cost || 0)) - 
                   Math.min(...estimations.map(e => e.total_estimated_cost || 0))).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
