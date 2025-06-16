
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSecurity } from '@/hooks/useSecurity';
import { FileText, Plus, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export const ComplianceReportsPanel: React.FC = () => {
  const { complianceReports, complianceReportsLoading, generateComplianceReport } = useSecurity();
  const [isCreating, setIsCreating] = useState(false);
  const [newReport, setNewReport] = useState({
    report_type: 'soc2' as 'soc2' | 'gdpr' | 'hipaa' | 'iso27001',
    period_start: '',
    period_end: ''
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'generating': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'generating': return 'secondary';
      default: return 'outline';
    }
  };

  const getComplianceTypeInfo = (type: string) => {
    switch (type) {
      case 'soc2':
        return { name: 'SOC 2 Type II', description: 'Security, Availability, Processing Integrity, Confidentiality, and Privacy' };
      case 'gdpr':
        return { name: 'GDPR', description: 'General Data Protection Regulation compliance' };
      case 'hipaa':
        return { name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' };
      case 'iso27001':
        return { name: 'ISO 27001', description: 'Information Security Management System' };
      default:
        return { name: type.toUpperCase(), description: 'Compliance report' };
    }
  };

  const handleCreateReport = async () => {
    if (!newReport.period_start || !newReport.period_end) return;
    
    await generateComplianceReport.mutateAsync(newReport);
    setNewReport({ report_type: 'soc2', period_start: '', period_end: '' });
    setIsCreating(false);
  };

  const complianceStats = {
    soc2: { score: 98, status: 'compliant' },
    gdpr: { score: 95, status: 'compliant' },
    hipaa: { score: 92, status: 'compliant' },
    iso27001: { score: 94, status: 'compliant' }
  };

  if (complianceReportsLoading) {
    return <div className="flex items-center justify-center h-32">Loading compliance reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(complianceStats).map(([type, stats]) => {
          const info = getComplianceTypeInfo(type);
          return (
            <Card key={type}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{info.name}</h3>
                  <Badge variant={stats.status === 'compliant' ? 'default' : 'destructive'}>
                    {stats.status}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.score}%</div>
                <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Compliance Reports</h3>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Compliance Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <Select value={newReport.report_type} onValueChange={(value: any) => setNewReport({ ...newReport, report_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soc2">SOC 2 Type II</SelectItem>
                    <SelectItem value="gdpr">GDPR</SelectItem>
                    <SelectItem value="hipaa">HIPAA</SelectItem>
                    <SelectItem value="iso27001">ISO 27001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Period Start</label>
                <Input
                  type="date"
                  value={newReport.period_start}
                  onChange={(e) => setNewReport({ ...newReport, period_start: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Period End</label>
                <Input
                  type="date"
                  value={newReport.period_end}
                  onChange={(e) => setNewReport({ ...newReport, period_end: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreateReport} disabled={!newReport.period_start || !newReport.period_end}>
                  Generate Report
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {complianceReports?.map((report) => {
            const info = getComplianceTypeInfo(report.report_type);
            return (
              <Card key={report.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{info.name} Report</span>
                      <Badge variant={getStatusBadgeVariant(report.status)}>
                        {getStatusIcon(report.status)}
                        {report.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Period:</span> {format(new Date(report.period_start), 'MMM d, yyyy')} - {format(new Date(report.period_end), 'MMM d, yyyy')}
                      </div>
                      <div>
                        <span className="font-medium">Generated:</span> {format(new Date(report.created_at), 'PPpp')}
                      </div>
                      {report.findings.length > 0 && (
                        <div>
                          <span className="font-medium">Findings:</span> {report.findings.length} items
                        </div>
                      )}
                      {report.recommendations.length > 0 && (
                        <div>
                          <span className="font-medium">Recommendations:</span> {report.recommendations.length} items
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {report.status === 'completed' && (
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          
          {(!complianceReports || complianceReports.length === 0) && (
            <div className="text-center text-muted-foreground py-8">
              No compliance reports found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
