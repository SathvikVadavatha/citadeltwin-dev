
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProjectMetricsData {
  totalProjects: number;
  completedProjects: number;
  projectsChange: number;
  chartData: Array<{
    date: string;
    projects: number;
    completed: number;
    inProgress: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
}

interface ProjectMetricsChartProps {
  data?: ProjectMetricsData;
  timeRange: string;
}

const chartConfig = {
  projects: {
    label: "Total Projects",
    color: "hsl(var(--chart-1))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  inProgress: {
    label: "In Progress",
    color: "hsl(var(--chart-3))",
  },
};

export const ProjectMetricsChart: React.FC<ProjectMetricsChartProps> = ({ data, timeRange }) => {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Metrics</CardTitle>
          <CardDescription>Loading project data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRate = data.totalProjects > 0 
    ? Math.round((data.completedProjects / data.totalProjects) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Metrics</CardTitle>
            <CardDescription>
              Project progress and completion trends over {timeRange}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completionRate}% Complete
            </Badge>
            <Badge variant={data.projectsChange >= 0 ? 'default' : 'destructive'}>
              {data.projectsChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {data.projectsChange >= 0 ? '+' : ''}{data.projectsChange}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData}>
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
                dataKey="projects" 
                stroke="var(--color-projects)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="var(--color-completed)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="inProgress" 
                stroke="var(--color-inProgress)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Project Status Distribution</h4>
          <div className="space-y-2">
            {data.statusDistribution.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-sm">{status.status}</span>
                </div>
                <span className="text-sm font-medium">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
