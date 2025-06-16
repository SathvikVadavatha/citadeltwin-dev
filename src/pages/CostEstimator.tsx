
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

const CostEstimator: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Estimator</h1>
          <p className="text-muted-foreground">Project cost estimation and budgeting tools</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Analysis
          </CardTitle>
          <CardDescription>
            Estimate project costs and manage budgets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Cost estimation tools will be available here.</p>
          <Button>Create Estimate</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostEstimator;
