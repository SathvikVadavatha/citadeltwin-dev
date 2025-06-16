
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ComplianceData {
  overallRate: number;
  rateChange: number;
  violationsByType: Array<{
    type: string;
    count: number;
    severity: 'critical' | 'major' | 'minor';
  }>;
  complianceByJurisdiction: Array<{
    jurisdiction: string;
    rate: number;
    violations: number;
  }>;
  trendData: Array<{
    date: string;
    rate: number;
    violations: number;
  }>;
}

interface ComplianceStatusChartProps {
  data?: ComplianceData;
  timeRange: string;
}

const chartConfig = {
  rate: {
    label: "Compliance Rate",
    color: "hsl(var(--chart-1))",
  },
  violations: {
    label: "Violations",
    color: "hsl(var(--chart-2))",
  },
};

const COLORS = {
  critical: '#ef4444',
  major: '#f59e0b',
  minor: '#10b981',
  compliant: '#22c55e'
};

export const ComplianceStatusChart: React.FC<ComplianceStatusChartProps> = ({ data, timeRange }) => {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>Loading compliance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Compliant', value: data.overallRate, color: COLORS.compliant },
    { name: 'Non-Compliant', value: 100 - data.overallRate, color: '#ef4444' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overall Compliance Rate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Compliance Overview
              </CardTitle>
              <CardDescription>
                Overall compliance rate across all projects
              </CardDescription>
            </div>
            <Badge variant={data.rateChange >= 0 ? 'default' : 'destructive'}>
              {data.rateChange >= 0 ? '+' : ''}{data.rateChange}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{data.overallRate}%</div>
            <div className="text-sm text-muted-foreground">Compliance Rate</div>
          </div>
        </CardContent>
      </Card>

      {/* Violations by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Violations by Type
          </CardTitle>
          <CardDescription>
            Breakdown of compliance violations by severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.violationsByType}>
                <XAxis 
                  dataKey="type" 
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
                <Bar 
                  dataKey="count" 
                  fill={(entry: any) => COLORS[entry.severity] || COLORS.minor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Critical</span>
              </div>
              <span className="font-medium">
                {data.violationsByType.filter(v => v.severity === 'critical').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span>Major</span>
              </div>
              <span className="font-medium">
                {data.violationsByType.filter(v => v.severity === 'major').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Minor</span>
              </div>
              <span className="font-medium">
                {data.violationsByType.filter(v => v.severity === 'minor').length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance by Jurisdiction */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Compliance by Jurisdiction</CardTitle>
          <CardDescription>
            Compliance rates across different jurisdictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.complianceByJurisdiction.map((jurisdiction, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="font-medium">{jurisdiction.jurisdiction}</div>
                  <div className="text-sm text-muted-foreground">
                    {jurisdiction.violations} violations found
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${jurisdiction.rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {jurisdiction.rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
