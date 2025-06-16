
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { GitBranch, RotateCcw, TrendingUp } from 'lucide-react';

interface IterationData {
  date: string;
  iterationsCount: number;
  averageTime: number;
  successRate: number;
}

interface DesignIterationsTrackerProps {
  data?: IterationData[];
  timeRange: string;
}

const chartConfig = {
  iterationsCount: {
    label: "Iterations",
    color: "hsl(var(--chart-1))",
  },
  averageTime: {
    label: "Avg Time (hrs)",
    color: "hsl(var(--chart-2))",
  },
  successRate: {
    label: "Success Rate (%)",
    color: "hsl(var(--chart-3))",
  },
};

export const DesignIterationsTracker: React.FC<DesignIterationsTrackerProps> = ({ data, timeRange }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Design Iterations</CardTitle>
          <CardDescription>Loading iteration data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalIterations = data.reduce((sum, item) => sum + item.iterationsCount, 0);
  const avgSuccessRate = data.reduce((sum, item) => sum + item.successRate, 0) / data.length;
  const avgTime = data.reduce((sum, item) => sum + item.averageTime, 0) / data.length;

  return (
    <div className="space-y-6">
      {/* Iterations Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-600" />
              Total Iterations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIterations}</div>
            <div className="text-xs text-muted-foreground">
              Across all projects
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgSuccessRate)}%</div>
            <div className="text-xs text-muted-foreground">
              Average across iterations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-purple-600" />
              Avg Time per Iteration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgTime)}h</div>
            <div className="text-xs text-muted-foreground">
              Time to completion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Iterations Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Design Iteration Trends</CardTitle>
          <CardDescription>
            Iteration frequency and success rates over {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="iterationsCount" 
                  stroke="var(--color-iterationsCount)" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="var(--color-successRate)" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Iteration Efficiency Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Iteration Efficiency</CardTitle>
          <CardDescription>
            Relationship between iteration time and success rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={data}>
                <XAxis 
                  dataKey="averageTime" 
                  name="Time (hrs)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  dataKey="successRate" 
                  name="Success Rate (%)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Scatter 
                  dataKey="successRate" 
                  fill="var(--color-successRate)"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Efficiency Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-600">Most Efficient Range</div>
                <div className="text-muted-foreground">
                  {Math.round(avgTime * 0.8)}-{Math.round(avgTime * 1.2)} hours per iteration
                </div>
              </div>
              <div>
                <div className="font-medium text-blue-600">Optimal Success Rate</div>
                <div className="text-muted-foreground">
                  {Math.round(avgSuccessRate)}% average success rate
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
