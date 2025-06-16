
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSecurity } from '@/hooks/useSecurity';
import { Search, Download, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const AuditLogsPanel: React.FC = () => {
  const { auditLogs, auditLogsLoading } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');

  const filteredLogs = auditLogs?.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;
    
    return matchesSearch && matchesAction && matchesResource;
  }) || [];

  const actions = [...new Set(auditLogs?.map(log => log.action) || [])];
  const resources = [...new Set(auditLogs?.map(log => log.resource_type) || [])];

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 80) return 'destructive';
    if (riskScore >= 60) return 'default';
    if (riskScore >= 40) return 'secondary';
    return 'outline';
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Risk Score'],
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_id || 'System',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.ip_address || '',
        log.risk_score.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (auditLogsLoading) {
    return <div className="flex items-center justify-center h-32">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map(action => (
              <SelectItem key={action} value={action}>{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {resources.map(resource => (
              <SelectItem key={resource} value={resource}>{resource}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={exportAuditLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Audit Logs List */}
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <Badge variant="secondary">{log.resource_type}</Badge>
                    <Badge variant={getRiskBadgeColor(log.risk_score)}>
                      Risk: {log.risk_score}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      <span className="font-medium">Time:</span> {format(new Date(log.created_at), 'PPpp')}
                    </div>
                    {log.user_id && (
                      <div>
                        <span className="font-medium">User:</span> {log.user_id}
                      </div>
                    )}
                    {log.ip_address && (
                      <div>
                        <span className="font-medium">IP:</span> {log.ip_address}
                      </div>
                    )}
                    {log.resource_id && (
                      <div>
                        <span className="font-medium">Resource ID:</span> {log.resource_id}
                      </div>
                    )}
                  </div>
                  
                  {Object.keys(log.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm font-medium cursor-pointer">Details</summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {filteredLogs.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No audit logs found matching your criteria
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
