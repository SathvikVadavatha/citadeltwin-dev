
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
  email: {
    projectUpdates: boolean;
    complianceAlerts: boolean;
    systemMaintenance: boolean;
    securityAlerts: boolean;
  };
  inApp: {
    projectUpdates: boolean;
    complianceAlerts: boolean;
    collaborationInvites: boolean;
    documentGeneration: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

export const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      projectUpdates: true,
      complianceAlerts: true,
      systemMaintenance: true,
      securityAlerts: true,
    },
    inApp: {
      projectUpdates: true,
      complianceAlerts: true,
      collaborationInvites: true,
      documentGeneration: true,
    },
    frequency: 'immediate',
  });

  const [saving, setSaving] = useState(false);

  const handleEmailToggle = (key: keyof NotificationPreferences['email']) => {
    setPreferences(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email[key]
      }
    }));
  };

  const handleInAppToggle = (key: keyof NotificationPreferences['inApp']) => {
    setPreferences(prev => ({
      ...prev,
      inApp: {
        ...prev.inApp,
        [key]: !prev.inApp[key]
      }
    }));
  };

  const handleFrequencyChange = (frequency: 'immediate' | 'daily' | 'weekly') => {
    setPreferences(prev => ({
      ...prev,
      frequency
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would save preferences to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Project Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails when projects are updated or completed
                </p>
              </div>
              <Switch
                checked={preferences.email.projectUpdates}
                onCheckedChange={() => handleEmailToggle('projectUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Compliance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about compliance violations and checks
                </p>
              </div>
              <Switch
                checked={preferences.email.complianceAlerts}
                onCheckedChange={() => handleEmailToggle('complianceAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>System Maintenance</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about scheduled maintenance
                </p>
              </div>
              <Switch
                checked={preferences.email.systemMaintenance}
                onCheckedChange={() => handleEmailToggle('systemMaintenance')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security-related notifications
                </p>
              </div>
              <Switch
                checked={preferences.email.securityAlerts}
                onCheckedChange={() => handleEmailToggle('securityAlerts')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Project Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications for project changes
                </p>
              </div>
              <Switch
                checked={preferences.inApp.projectUpdates}
                onCheckedChange={() => handleInAppToggle('projectUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Compliance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Display compliance-related notifications
                </p>
              </div>
              <Switch
                checked={preferences.inApp.complianceAlerts}
                onCheckedChange={() => handleInAppToggle('complianceAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Collaboration Invites</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications for collaboration requests
                </p>
              </div>
              <Switch
                checked={preferences.inApp.collaborationInvites}
                onCheckedChange={() => handleInAppToggle('collaborationInvites')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Document Generation</Label>
                <p className="text-sm text-muted-foreground">
                  Updates on document generation progress
                </p>
              </div>
              <Switch
                checked={preferences.inApp.documentGeneration}
                onCheckedChange={() => handleInAppToggle('documentGeneration')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Digest Frequency</Label>
            <Select value={preferences.frequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose how often you want to receive email notifications
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};
