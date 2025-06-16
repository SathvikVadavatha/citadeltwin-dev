
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSecurity } from '@/hooks/useSecurity';
import { Shield, AlertTriangle, Database, FileCheck, Key, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SecurityMetricsCards: React.FC = () => {
  const { 
    auditLogs, 
    securityEvents, 
    backupJobs, 
    complianceReports, 
    encryptionKeys, 
    userSessions 
  } = useSecurity();

  const activeIncidents = securityEvents?.filter(event => !event.resolved).length || 0;
  const criticalEvents = securityEvents?.filter(event => event.severity === 'critical').length || 0;
  const recentBackups = backupJobs?.filter(job => 
    job.status === 'completed' && 
    new Date(job.completed_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length || 0;
  const activeKeys = encryptionKeys?.filter(key => key.is_active).length || 0;
  const activeSessions = userSessions?.filter(session => session.is_active).length || 0;
  const pendingReports = complianceReports?.filter(report => report.status === 'generating').length || 0;

  const metrics = [
    {
      title: 'Security Score',
      value: '92%',
      description: 'Overall security posture',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Incidents',
      value: activeIncidents.toString(),
      description: `${criticalEvents} critical events`,
      icon: AlertTriangle,
      color: activeIncidents > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: activeIncidents > 0 ? 'bg-red-50' : 'bg-green-50'
    },
    {
      title: 'Recent Backups',
      value: recentBackups.toString(),
      description: 'Last 7 days',
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Compliance Status',
      value: '98%',
      description: `${pendingReports} reports pending`,
      icon: FileCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Encryption Keys',
      value: activeKeys.toString(),
      description: 'Active keys',
      icon: Key,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Sessions',
      value: activeSessions.toString(),
      description: 'Current user sessions',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
