
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, Server, AlertTriangle } from 'lucide-react';

interface SystemPerformanceData {
  uptime: number;
  avgProcessingTime: number;
  processingTimeChange: number;
  uptimeChange: number;
  performanceMetrics: Array<{
    timestamp: string;
    responseTime: number;
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
  }>;
  serviceStatus: Array<{
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    uptime: number;
  }>;
  errorRates: Array<{
    timestamp: string;
    errorRate: number;
    requestCount: number;
  }>;
}

interface SystemPerformanceMonitorProps {
  data?: SystemPerformanceData;
  timeRange: string;
}

const chartConfig = {
  responseTime: {
    label: "Response Time (ms)",
    color: "hsl(var(--chart-1))",
  },
  cpuUsage: {
    label: "CPU Usage (%)",
    color: "hsl(var(--chart-2))",
  },
  memoryUsage: {
    label: "Memory Usage (%)",
    color: "hsl(var(--chart-3))",
  },
  errorRate: {
    label: "Error Rate (%)",
    color: "hsl(var(--chart-4))",
  },
};

export const SystemPerformanceMonitor: React.FC<SystemPerformanceMonitorProps> = ({ data, timeRange }) => {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-orange-600 bg-orange-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Zap className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'down': return <Server className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.uptime}%</div>
            <Badge variant={data.uptimeChange >= 0 ? 'default' : 'destructive'} className="mt-1">
              {data.uptimeChange >= 0 ? '+' : ''}{data.uptimeChange}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgProcessingTime}ms</div>
            <Badge variant={data.processingTimeChange <= 0 ? 'default' : 'destructive'} className="mt-1">
              {data.processingTimeChange >= 0 ? '+' : ''}{data.processingTimeChange}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performanceMetrics[data.performanceMetrics.length - 1]?.activeConnections || 0}
            </div>
            <div className="text-xs text-muted-foreground">Current connections</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.errorRates[data.errorRates.length - 1]?.errorRate || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Last hour</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time & Resource Usage</CardTitle>
            <CardDescription>
              System performance metrics over {timeRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.performanceMetrics}>
                  <XAxis 
                    dataKey="timestamp" 
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
                    dataKey="responseTime" 
                    stroke="var(--color-responseTime)" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpuUsage" 
                    stroke="var(--color-cpuUsage)" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memoryUsage" 
                    stroke="var(--color-memoryUsage)" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Rate Trends</CardTitle>
            <CardDescription>
              System error rates and request volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.errorRates}>
                  <XAxis 
                    dataKey="timestamp" 
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
                  <Area 
                    type="monotone" 
                    dataKey="errorRate" 
                    stroke="var(--color-errorRate)" 
                    fill="var(--color-errorRate)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health Status</CardTitle>
          <CardDescription>
            Current status of all system services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.serviceStatus.map((service, index) => (
              <div key={index} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-full ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                    </span>
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                    {service.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Response: {service.responseTime}ms</div>
                  <div>Uptime: {service.uptime}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
