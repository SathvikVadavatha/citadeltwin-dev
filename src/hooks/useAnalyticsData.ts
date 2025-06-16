
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

interface ProjectMetrics {
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
  timeline: Array<{
    id: string;
    project: string;
    milestone: string;
    status: 'completed' | 'in-progress' | 'pending' | 'delayed';
    date: string;
    duration: string;
    progress: number;
  }>;
  iterations: Array<{
    date: string;
    iterationsCount: number;
    averageTime: number;
    successRate: number;
  }>;
}

interface ComplianceStats {
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

interface UserProductivity {
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

interface SystemPerformance {
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

export const useAnalyticsData = (timeRange: '7d' | '30d' | '90d' | '1y') => {
  const { user } = useAuth();

  // Project Metrics Query
  const { data: projectMetrics, isLoading: projectsLoading } = useQuery({
    queryKey: ['analytics-projects', timeRange, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get projects data
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id);

      // Get uploads data for progress tracking
      const { data: uploads } = await supabase
        .from('blueprint_uploads')
        .select('*')
        .eq('user_id', user.id);

      // Mock data for demonstration - in real implementation, this would aggregate from actual data
      const mockData: ProjectMetrics = {
        totalProjects: projects?.length || 0,
        completedProjects: Math.floor((projects?.length || 0) * 0.7),
        projectsChange: 12,
        chartData: generateMockChartData(timeRange),
        statusDistribution: [
          { status: 'Completed', count: Math.floor((projects?.length || 0) * 0.7), color: '#22c55e' },
          { status: 'In Progress', count: Math.floor((projects?.length || 0) * 0.2), color: '#3b82f6' },
          { status: 'Planning', count: Math.floor((projects?.length || 0) * 0.1), color: '#f59e0b' },
        ],
        timeline: generateMockTimeline(),
        iterations: generateMockIterations(timeRange)
      };

      return mockData;
    },
    enabled: !!user,
  });

  // Compliance Stats Query
  const { data: complianceStats, isLoading: complianceLoading } = useQuery({
    queryKey: ['analytics-compliance', timeRange, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get compliance violations
      const { data: violations } = await supabase
        .from('compliance_violations')
        .select('*');

      // Get compliance checks
      const { data: checks } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('user_id', user.id);

      const mockData: ComplianceStats = {
        overallRate: 94,
        rateChange: 3,
        violationsByType: [
          { type: 'Building Height', count: 5, severity: 'major' },
          { type: 'Setbacks', count: 3, severity: 'minor' },
          { type: 'Fire Safety', count: 2, severity: 'critical' },
          { type: 'Accessibility', count: 7, severity: 'minor' },
        ],
        complianceByJurisdiction: [
          { jurisdiction: 'San Francisco', rate: 96, violations: 4 },
          { jurisdiction: 'Los Angeles', rate: 92, violations: 8 },
          { jurisdiction: 'San Diego', rate: 95, violations: 5 },
          { jurisdiction: 'Sacramento', rate: 91, violations: 9 },
        ],
        trendData: generateMockComplianceTrend(timeRange)
      };

      return mockData;
    },
    enabled: !!user,
  });

  // User Productivity Query
  const { data: userProductivity, isLoading: productivityLoading } = useQuery({
    queryKey: ['analytics-productivity', timeRange, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      const mockData: UserProductivity = {
        totalUsers: profiles?.length || 0,
        activeUsers: Math.floor((profiles?.length || 0) * 0.8),
        avgSessionTime: 45,
        productivityTrend: generateMockProductivityTrend(timeRange),
        userActivity: [
          { user: 'John Doe', sessionsCount: 23, avgSessionDuration: 52, projectsCompleted: 8 },
          { user: 'Jane Smith', sessionsCount: 19, avgSessionDuration: 38, projectsCompleted: 6 },
          { user: 'Bob Johnson', sessionsCount: 17, avgSessionDuration: 41, projectsCompleted: 5 },
          { user: 'Alice Wilson', sessionsCount: 15, avgSessionDuration: 35, projectsCompleted: 4 },
          { user: 'Charlie Brown', sessionsCount: 12, avgSessionDuration: 29, projectsCompleted: 3 },
        ]
      };

      return mockData;
    },
    enabled: !!user,
  });

  // System Performance Query
  const { data: systemPerformance, isLoading: systemLoading } = useQuery({
    queryKey: ['analytics-system', timeRange],
    queryFn: async () => {
      const mockData: SystemPerformance = {
        uptime: 99.8,
        avgProcessingTime: 2.3,
        processingTimeChange: -5,
        uptimeChange: 0.2,
        performanceMetrics: generateMockPerformanceMetrics(timeRange),
        serviceStatus: [
          { service: 'FEA Engine', status: 'healthy', responseTime: 850, uptime: 99.9 },
          { service: 'AI Blueprint Parser', status: 'healthy', responseTime: 1200, uptime: 99.7 },
          { service: 'GIS Services', status: 'degraded', responseTime: 2300, uptime: 98.5 },
          { service: 'Compliance Engine', status: 'healthy', responseTime: 650, uptime: 99.8 },
          { service: 'Document Generator', status: 'healthy', responseTime: 950, uptime: 99.6 },
          { service: 'User Authentication', status: 'healthy', responseTime: 150, uptime: 99.9 },
        ],
        errorRates: generateMockErrorRates(timeRange)
      };

      return mockData;
    },
  });

  const isLoading = projectsLoading || complianceLoading || productivityLoading || systemLoading;

  return {
    projectMetrics,
    complianceStats,
    userProductivity,
    systemPerformance,
    isLoading,
  };
};

// Helper functions to generate mock data
function generateMockChartData(timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const data = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      projects: Math.floor(Math.random() * 10) + 5,
      completed: Math.floor(Math.random() * 8) + 2,
      inProgress: Math.floor(Math.random() * 5) + 1,
    });
  }
  
  return data;
}

function generateMockTimeline() {
  return [
    {
      id: '1',
      project: 'Downtown Complex',
      milestone: 'FEA Analysis Complete',
      status: 'completed' as const,
      date: '2 hours ago',
      duration: '3.5 hrs',
      progress: 100
    },
    {
      id: '2',
      project: 'Residential Tower',
      milestone: 'Compliance Check',
      status: 'in-progress' as const,
      date: '4 hours ago',
      duration: '1.2 hrs',
      progress: 75
    },
    {
      id: '3',
      project: 'Industrial Facility',
      milestone: 'Blueprint Upload',
      status: 'completed' as const,
      date: '6 hours ago',
      duration: '0.5 hrs',
      progress: 100
    }
  ];
}

function generateMockIterations(timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const data = [];
  
  for (let i = days; i >= 0; i -= Math.ceil(days / 10)) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      iterationsCount: Math.floor(Math.random() * 5) + 1,
      averageTime: Math.floor(Math.random() * 10) + 5,
      successRate: Math.floor(Math.random() * 20) + 80,
    });
  }
  
  return data;
}

function generateMockComplianceTrend(timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const data = [];
  
  for (let i = days; i >= 0; i -= Math.ceil(days / 15)) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      rate: Math.floor(Math.random() * 10) + 90,
      violations: Math.floor(Math.random() * 5) + 1,
    });
  }
  
  return data;
}

function generateMockProductivityTrend(timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const data = [];
  
  for (let i = days; i >= 0; i -= Math.ceil(days / 20)) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      activeUsers: Math.floor(Math.random() * 20) + 15,
      documentsGenerated: Math.floor(Math.random() * 50) + 25,
      analysesCompleted: Math.floor(Math.random() * 30) + 10,
    });
  }
  
  return data;
}

function generateMockPerformanceMetrics(timeRange: string) {
  const hours = timeRange === '7d' ? 24 : timeRange === '30d' ? 120 : timeRange === '90d' ? 360 : 1440;
  const data = [];
  
  for (let i = hours; i >= 0; i -= Math.ceil(hours / 24)) {
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - i);
    
    data.push({
      timestamp: timestamp.toISOString(),
      responseTime: Math.floor(Math.random() * 1000) + 500,
      cpuUsage: Math.floor(Math.random() * 40) + 20,
      memoryUsage: Math.floor(Math.random() * 30) + 40,
      activeConnections: Math.floor(Math.random() * 100) + 50,
    });
  }
  
  return data;
}

function generateMockErrorRates(timeRange: string) {
  const hours = timeRange === '7d' ? 24 : timeRange === '30d' ? 120 : timeRange === '90d' ? 360 : 1440;
  const data = [];
  
  for (let i = hours; i >= 0; i -= Math.ceil(hours / 12)) {
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - i);
    
    data.push({
      timestamp: timestamp.toISOString(),
      errorRate: Math.random() * 2,
      requestCount: Math.floor(Math.random() * 1000) + 500,
    });
  }
  
  return data;
}
