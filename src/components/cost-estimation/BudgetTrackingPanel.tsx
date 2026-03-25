
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import type { CostEstimation } from '@/types/cost-estimation';

interface BudgetTrackingPanelProps {
  projectId: string;
  estimations: CostEstimation[];
}

export const BudgetTrackingPanel = ({ projectId, estimations }: BudgetTrackingPanelProps) => {
  // Mock budget data - in a real app, this would come from a useBudget hook
  const mockBudgetData = {
    approvedBudget: 500000,
    spentToDate: 125000,
    committed: 75000,
    contingency: 50000,
    actualCosts: [
      { category: 'Materials', budgeted: 200000, spent: 45000, committed: 30000 },
      { category: 'Labor', budgeted: 150000, spent: 60000, committed: 25000 },
      { category: 'Equipment', budgeted: 75000, spent: 15000, committed: 10000 },
      { category: 'Overhead', budgeted: 50000, spent: 5000, committed: 10000 },
    ]
  };

  const totalEstimated = estimations.reduce((sum, est) => sum + (est.total_estimated_cost || 0), 0);
  const remainingBudget = mockBudgetData.approvedBudget - mockBudgetData.spentToDate - mockBudgetData.committed;
  const budgetUtilization = ((mockBudgetData.spentToDate + mockBudgetData.committed) / mockBudgetData.approvedBudget) * 100;
  const isOverBudget = totalEstimated > mockBudgetData.approvedBudget;

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold shadow-sm">
              ${mockBudgetData.approvedBudget.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent to Date</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${mockBudgetData.spentToDate.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((mockBudgetData.spentToDate / mockBudgetData.approvedBudget) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Committed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${mockBudgetData.committed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending payments
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget > 0 ? 'text-green-600' : 'text-destructive'}`}>
              ${remainingBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available budget
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Estimates Comparison */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Budget vs Estimates
            <Badge className={isOverBudget ? 'bg-red-500/20 text-destructive' : 'bg-green-500/20 text-green-600'}>
              {isOverBudget ? 'Over Budget' : 'Within Budget'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Budget Utilization</span>
              <span className="font-medium">{budgetUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={budgetUtilization} className="h-3" />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Estimates:</p>
                <p className="text-lg font-semibold">${totalEstimated.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget Variance:</p>
                <p className={`text-lg font-semibold ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
                  {isOverBudget ? '+' : ''}${(totalEstimated - mockBudgetData.approvedBudget).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle>Budget by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockBudgetData.actualCosts.map((category) => {
              const totalUsed = category.spent + category.committed;
              const utilization = (totalUsed / category.budgeted) * 100;
              const isOverBudget = utilization > 100;
              
              return (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.category}</span>
                    <div className="flex items-center space-x-2">
                      <Badge className={isOverBudget ? 'bg-red-500/20 text-destructive' : 'bg-green-500/20 text-green-600'}>
                        {utilization.toFixed(1)}%
                      </Badge>
                      {isOverBudget ? 
                        <AlertTriangle className="w-4 h-4 text-destructive" /> : 
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      }
                    </div>
                  </div>
                  <Progress value={Math.min(utilization, 100)} className="h-2" />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Budgeted:</span>
                      <p className="font-medium">${category.budgeted.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Spent:</span>
                      <p className="font-medium">${category.spent.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Committed:</span>
                      <p className="font-medium">${category.committed.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Budget Actions */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle>Budget Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" className="skeuo-button">
              Export Budget Report
            </Button>
            <Button variant="outline" className="skeuo-button">
              Adjust Budget
            </Button>
            <Button variant="outline" className="skeuo-button">
              Create Change Order
            </Button>
            <Button variant="outline" className="skeuo-button">
              Budget Forecast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Budget Alerts */}
      {(isOverBudget || budgetUtilization > 90) && (
        <Card className="gradient-border border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isOverBudget && (
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Project estimates exceed approved budget by ${(totalEstimated - mockBudgetData.approvedBudget).toLocaleString()}</span>
                </div>
              )}
              {budgetUtilization > 90 && (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Budget utilization is at {budgetUtilization.toFixed(1)}% - consider review</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
