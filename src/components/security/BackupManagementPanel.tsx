
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useSecurity } from '@/hooks/useSecurity';
import { Database, Play, Clock, CheckCircle, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';

export const BackupManagementPanel: React.FC = () => {
  const { backupJobs, backupJobsLoading, createBackupJob } = useSecurity();
  const [selectedJobType, setSelectedJobType] = useState<'full' | 'incremental' | 'differential'>('full');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'default';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const calculateDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const handleCreateBackup = async () => {
    await createBackupJob.mutateAsync({
      job_type: selectedJobType,
      metadata: {
        scheduled: false,
        priority: 'normal'
      }
    });
  };

  const getBackupProgress = () => {
    const runningJobs = backupJobs?.filter(job => job.status === 'running') || [];
    return runningJobs.length > 0 ? 65 : 0; // Simulated progress
  };

  if (backupJobsLoading) {
    return <div className="flex items-center justify-center h-32">Loading backup jobs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Backup Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Backup Type</label>
              <Select value={selectedJobType} onValueChange={(value: any) => setSelectedJobType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select backup type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental Backup</SelectItem>
                  <SelectItem value="differential">Differential Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleCreateBackup} disabled={createBackupJob.isPending}>
              <Play className="h-4 w-4 mr-2" />
              Start Backup
            </Button>
          </div>
          
          {getBackupProgress() > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Backup in Progress</span>
                <span className="text-sm text-muted-foreground">{getBackupProgress()}%</span>
              </div>
              <Progress value={getBackupProgress()} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold">{backupJobs?.length || 0}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {backupJobs?.filter(job => job.status === 'completed').length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {backupJobs?.filter(job => job.status === 'failed').length || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-blue-600">
                  {backupJobs?.filter(job => job.status === 'running').length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {backupJobs?.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)} Backup</span>
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Started: {format(new Date(job.created_at), 'PPpp')}
                        {job.completed_at && (
                          <span className="ml-2">
                            • Duration: {calculateDuration(job.started_at, job.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {job.file_size && (
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(job.file_size)}
                      </span>
                    )}
                    
                    {job.status === 'completed' && job.backup_location && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {(!backupJobs || backupJobs.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                  No backup jobs found
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
