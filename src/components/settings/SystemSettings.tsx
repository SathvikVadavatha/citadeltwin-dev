
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSecurity } from '@/hooks/useSecurity';
import { toast } from 'sonner';
import { Monitor, Database, Download, Trash2, HardDrive, Cpu, Wifi } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { backupJobs, createBackupJob } = useSecurity();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [autoBackup, setAutoBackup] = useState(true);
  const [dataRetention, setDataRetention] = useState('90');
  const [creating, setCreating] = useState(false);

  // Mock system stats
  const systemStats = {
    storage: { used: 45, total: 100 },
    cpu: 23,
    memory: 67,
    activeUsers: 12,
    uptime: '15 days, 7 hours'
  };

  const recentBackups = backupJobs?.slice(0, 5) || [];

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await createBackupJob.mutateAsync({
        job_type: 'full',
        metadata: { manual: true, created_from: 'settings' }
      });
      toast.success('Backup job started');
    } catch (error) {
      toast.error('Failed to start backup');
    } finally {
      setCreating(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // Here you would apply the theme change
    toast.success(`Theme changed to ${newTheme}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose your preferred theme or follow your system setting
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your data daily
              </p>
            </div>
            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
          </div>

          <div className="space-y-2">
            <Label>Data Retention Period</Label>
            <Select value={dataRetention} onValueChange={setDataRetention}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How long to keep deleted items in trash
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Manual Backup</Label>
              <p className="text-sm text-muted-foreground">
                Create a backup of all your data now
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleCreateBackup}
              disabled={creating}
            >
              <Download className="h-4 w-4 mr-2" />
              {creating ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Backups</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBackups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent backups found</p>
          ) : (
            <div className="space-y-3">
              {recentBackups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={backup.status === 'completed' ? 'default' : 'secondary'}>
                        {backup.status}
                      </Badge>
                      <span className="font-medium capitalize">{backup.job_type} Backup</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(backup.created_at).toLocaleString()}
                      {backup.file_size && ` • ${(backup.file_size / (1024 * 1024)).toFixed(1)} MB`}
                    </p>
                  </div>
                  {backup.status === 'completed' && (
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <Label>Storage Usage</Label>
              </div>
              <Progress value={systemStats.storage.used} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {systemStats.storage.used}GB of {systemStats.storage.total}GB used
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <Label>CPU Usage</Label>
              </div>
              <Progress value={systemStats.cpu} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {systemStats.cpu}% usage
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <Label>Memory Usage</Label>
              </div>
              <Progress value={systemStats.memory} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {systemStats.memory}% usage
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <Label>System Status</Label>
              </div>
              <Badge variant="default">Online</Badge>
              <p className="text-sm text-muted-foreground">
                Uptime: {systemStats.uptime}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Active Users</Label>
                <p className="text-sm text-muted-foreground">
                  {systemStats.activeUsers} users currently online
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Clear Cache</Label>
              <p className="text-sm text-muted-foreground">
                Clear temporary files and cached data
              </p>
            </div>
            <Button variant="outline">
              Clear Cache
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Clean Old Logs</Label>
              <p className="text-sm text-muted-foreground">
                Remove log files older than 30 days
              </p>
            </div>
            <Button variant="outline">
              Clean Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
