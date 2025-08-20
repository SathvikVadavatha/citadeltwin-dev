import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { ScheduledReport, CreateScheduledReportRequest } from '@/types/scheduledReports';
import { Badge } from '@/components/ui/badge';

interface ScheduledReportFormProps {
  report?: ScheduledReport | null;
  onClose: () => void;
}

export const ScheduledReportForm: React.FC<ScheduledReportFormProps> = ({ report, onClose }) => {
  const { createReport, updateReport, isCreating, isUpdating } = useScheduledReports();
  const [formData, setFormData] = useState<CreateScheduledReportRequest>({
    name: '',
    report_type: 'performance',
    frequency: 'weekly',
    delivery_format: 'pdf',
    recipients: [],
    filters: {},
    schedule_config: {
      hour: 9,
      minute: 0,
      day_of_week: 1, // Monday
      timezone: 'UTC'
    }
  });
  const [newRecipient, setNewRecipient] = useState('');

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        report_type: report.report_type,
        frequency: report.frequency,
        delivery_format: report.delivery_format,
        recipients: report.recipients,
        filters: report.filters,
        schedule_config: report.schedule_config
      });
    }
  }, [report]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (report) {
      updateReport({ id: report.id, data: formData });
    } else {
      createReport(formData);
    }
    onClose();
  };

  const addRecipient = () => {
    if (newRecipient && !formData.recipients.includes(newRecipient)) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient]
      }));
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const handleScheduleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule_config: {
        ...prev.schedule_config,
        [key]: value
      }
    }));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>
              {report ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
            </CardTitle>
            <CardDescription>
              Configure automated report delivery settings
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Report Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Weekly Performance Report"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select
                value={formData.report_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, report_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="fea_analysis">FEA Analysis</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Delivery Format</Label>
              <Select
                value={formData.delivery_format}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, delivery_format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Schedule Configuration</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hour">Hour (24h)</Label>
                <Input
                  id="hour"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.schedule_config.hour}
                  onChange={(e) => handleScheduleConfigChange('hour', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minute">Minute</Label>
                <Input
                  id="minute"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.schedule_config.minute}
                  onChange={(e) => handleScheduleConfigChange('minute', parseInt(e.target.value))}
                />
              </div>
            </div>

            {formData.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="day-of-week">Day of Week</Label>
                <Select
                  value={formData.schedule_config.day_of_week?.toString()}
                  onValueChange={(value) => handleScheduleConfigChange('day_of_week', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="day-of-month">Day of Month</Label>
                <Input
                  id="day-of-month"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.schedule_config.day_of_month}
                  onChange={(e) => handleScheduleConfigChange('day_of_month', parseInt(e.target.value))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.schedule_config.timezone}
                onValueChange={(value) => handleScheduleConfigChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Recipients</Label>
            <div className="flex gap-2">
              <Input
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Enter email address"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
              />
              <Button type="button" onClick={addRecipient} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.recipients.map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeRecipient(email)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isCreating || isUpdating}>
              {report ? 'Update Schedule' : 'Create Schedule'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};