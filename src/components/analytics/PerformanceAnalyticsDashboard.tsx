
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProjectMetricsChart } from './ProjectMetricsChart';
import { ComplianceStatusChart } from './ComplianceStatusChart';
import { UserProductivityChart } from './UserProductivityChart';
import { SystemPerformanceMonitor } from './SystemPerformanceMonitor';
import { ProjectProgressTimeline } from './ProjectProgressTimeline';
import { DesignIterationsTracker } from './DesignIterationsTracker';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { 
  TrendingUp, 
  Activity, 
  Users, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Zap,
  AlertTriangle 
} from 'lucide-react';

export const PerformanceAnalyticsDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { 
    projectMetrics, 
    complianceStats, 
    userProductivity, 
    systemPerformance,
    isLoading 
  } = useAnalyticsData(selectedTimeRange);

  const overviewStats = [
    {
      title: 'Active Projects',
      value: projectMetrics?.totalProjects || 0,
      change: projectMetrics?.projectsChange || 0,
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      title: 'Compliance Rate',
      value: `${complianceStats?.overallRate || 0}%`,
      change: complianceStats?.rateChange || 0,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Avg. Processing Time',
      value: `${systemPerformance?.avgProcessingTime || 0}s`,
      change: systemPerformance?.processingTimeChange || 0,
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'System Uptime',
      value: `${systemPerformance?.uptime || 0}%`,
      change: systemPerformance?.uptimeChange || 0,
      icon: Zap,
      color: 'text-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into project progress, compliance, and system performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedTimeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <Badge variant={stat.change >= 0 ? 'default' : 'destructive'} className="ml-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change >= 0 ? '+' : ''}{stat.change}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="productivity" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Productivity
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="iterations" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Iterations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectMetricsChart data={projectMetrics} timeRange={selectedTimeRange} />
            <ProjectProgressTimeline data={projectMetrics?.timeline} />
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6 mt-6">
          <ComplianceStatusChart data={complianceStats} timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6 mt-6">
          <UserProductivityChart data={userProductivity} timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="system" className="space-y-6 mt-6">
          <SystemPerformanceMonitor data={systemPerformance} timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="iterations" className="space-y-6 mt-6">
          <DesignIterationsTracker data={projectMetrics?.iterations} timeRange={selectedTimeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
