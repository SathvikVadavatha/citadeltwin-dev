
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, 
  Camera, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface ChangeStats {
  totalSnapshots: number;
  totalBranches: number;
  activeCollaborators: number;
  pendingChanges: number;
  recentActivity: number;
  branchHealth: {
    healthy: number;
    stale: number;
    conflicts: number;
  };
}

interface RecentChange {
  id: string;
  type: 'snapshot' | 'branch' | 'merge';
  title: string;
  user: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  branch: string;
}

interface ChangeManagementDashboardProps {
  stats: ChangeStats;
  recentChanges: RecentChange[];
  onNavigateToSnapshots: () => void;
  onNavigateToBranches: () => void;
  onNavigateToAudit: () => void;
}

export const ChangeManagementDashboard = ({
  stats,
  recentChanges,
  onNavigateToSnapshots,
  onNavigateToBranches,
  onNavigateToAudit
}: ChangeManagementDashboardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const branchHealthPercentage = stats.branchHealth.healthy / 
    (stats.branchHealth.healthy + stats.branchHealth.stale + stats.branchHealth.conflicts) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Change Management Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Overview of project version control and collaboration activity
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-500" />
              <CardDescription>Total Snapshots</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSnapshots}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm" 
              onClick={onNavigateToSnapshots}
            >
              View all snapshots →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-green-500" />
              <CardDescription>Active Branches</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBranches}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm" 
              onClick={onNavigateToBranches}
            >
              Manage branches →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <CardDescription>Active Collaborators</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCollaborators}</div>
            <div className="text-sm text-muted-foreground">
              {stats.pendingChanges} pending changes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <CardDescription>Recent Activity</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <div className="text-sm text-muted-foreground">changes this week</div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch Health</CardTitle>
          <CardDescription>Overall health status of project branches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Health</span>
                <span>{Math.round(branchHealthPercentage)}%</span>
              </div>
              <Progress value={branchHealthPercentage} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Healthy: {stats.branchHealth.healthy}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Stale: {stats.branchHealth.stale}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Conflicts: {stats.branchHealth.conflicts}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Changes</CardTitle>
              <CardDescription>Latest version control activity</CardDescription>
            </div>
            <Button variant="outline" onClick={onNavigateToAudit}>
              View Full Audit Trail
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentChanges.map((change) => (
              <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(change.status)}
                  <div>
                    <div className="font-medium text-sm">{change.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {change.user} • {change.branch} • {format(new Date(change.timestamp), 'MMM d, HH:mm')}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(change.status)}>
                  {change.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
