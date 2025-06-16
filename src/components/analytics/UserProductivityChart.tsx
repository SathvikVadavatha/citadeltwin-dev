
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, TrendingUp } from 'lucide-react';

interface UserProductivityData {
  totalUsers: number;
  activeUsers: number;
  avgSessionTime: number;
  productivityTrend: Array<{
    date: string;
    activeUsers: number;
    documentsGenerated: number;
    analysesCompleted: number;
  }>;
  userActivity: Array<{
    user: string;
    sessionsCount: number;
    avgSessionDuration: number;
    projectsCompleted: number;
  }>;
}

interface UserProductivityChartProps {
  data?: UserProductivityData;
  timeRange: string;
}

const chartConfig = {
  activeUsers: {
    label: "Active Users",
    color: "hsl(var(--chart-1))",
  },
  documentsGenerated: {
    label: "Documents Generated",
    color: "hsl(var(--chart-2))",
  },
  analysesCompleted: {
    label: "Analyses Completed",
    color: "hsl(var(--chart-3))",
  },
};

export const UserProductivityChart: React.FC<UserProductivityChartProps> = ({ data, timeRange }) => {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Productivity</CardTitle>
          <CardDescription>Loading productivity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activityRate = data.totalUsers > 0 
    ? Math.round((data.activeUsers / data.totalUsers) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Productivity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsers}</div>
            <div className="text-xs text-muted-foreground">
              {activityRate}% of total users
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              Avg Session Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgSessionTime}m</div>
            <div className="text-xs text-muted-foreground">
              Per active session
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <div className="text-xs text-muted-foreground">
              Registered users
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Trends</CardTitle>
          <CardDescription>
            User activity and output metrics over {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.productivityTrend}>
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
                  dataKey="activeUsers" 
                  stroke="var(--color-activeUsers)" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="documentsGenerated" 
                  stroke="var(--color-documentsGenerated)" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="analysesCompleted" 
                  stroke="var(--color-analysesCompleted)" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* User Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Top User Activity</CardTitle>
          <CardDescription>
            Most active users and their productivity metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.userActivity.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium">{user.user.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-medium">{user.user}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.sessionsCount} sessions • {user.avgSessionDuration}m avg
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{user.projectsCompleted}</div>
                  <div className="text-xs text-muted-foreground">projects</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
