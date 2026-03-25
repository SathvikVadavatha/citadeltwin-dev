import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Mail, Plus, Settings, Trash2 } from 'lucide-react';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { useDeliveryLogs } from '@/hooks/useDeliveryLogs';
import { ScheduledReportForm } from './ScheduledReportForm';
import { DeliveryLogsViewer } from './DeliveryLogsViewer';
import { ScheduledReport } from '@/types/scheduledReports';
import { format } from 'date-fns';

export const ScheduledReports: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const { scheduledReports, isLoading, deleteReport, toggleActive } = useScheduledReports();
  const { deliveryLogs } = useDeliveryLogs();

  const handleEdit = (report: ScheduledReport) => {
    setEditingReport(report);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled report?')) {
      deleteReport(id);
    }
  };

  const getFrequencyText = (report: ScheduledReport) => {
    const config = report.schedule_config;
    const time = `${config.hour.toString().padStart(2, '0')}:${config.minute.toString().padStart(2, '0')}`;
    
    switch (report.frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[config.day_of_week || 1];
        return `Weekly on ${dayName} at ${time}`;
      case 'monthly':
        return `Monthly on day ${config.day_of_month || 1} at ${time}`;
      default:
        return report.frequency;
    }
  };

  const getStatusColor = (isActive: boolean, nextRun?: string) => {
    if (!isActive) return 'secondary';
    if (nextRun && new Date(nextRun) < new Date()) return 'destructive';
    return 'default';
  };

  if (showForm) {
    return (
      <ScheduledReportForm
        report={editingReport}
        onClose={() => {
          setShowForm(false);
          setEditingReport(null);
        }}
      />
    );
  }

  if (showLogs) {
    return <DeliveryLogsViewer onClose={() => setShowLogs(false)} />;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Scheduled Reports</CardTitle>
            <CardDescription>
              Automate report delivery on a schedule
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : scheduledReports.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No scheduled reports</h3>
            <p className="text-muted-foreground mb-4">
              Create your first scheduled report to automate delivery
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{report.name}</h3>
                      <Badge 
                        variant={getStatusColor(report.is_active, report.next_run_at)}
                        className="text-xs"
                      >
                        {report.is_active ? 'Active' : 'Paused'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {report.report_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getFrequencyText(report)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                      </div>
                      <div>
                        Format: {report.delivery_format.toUpperCase()}
                      </div>
                    </div>
                    
                    {report.next_run_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Next run: {format(new Date(report.next_run_at), 'MMM d, yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={report.is_active}
                      onCheckedChange={(checked) => 
                        toggleActive({ id: report.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(report)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Create Schedule Button */}
        {scheduledReports.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        )}
        
        {/* Delivery Logs Button */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => setShowLogs(true)}
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            Delivery Logs
          </Button>
        </div>
        
        {/* Recent Deliveries Section */}
        {deliveryLogs.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Recent Deliveries</h4>
            <div className="space-y-2">
              {deliveryLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {log.status}
                    </Badge>
                    <span>{log.scheduled_reports.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};