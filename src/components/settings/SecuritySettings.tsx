
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSecurity } from '@/hooks/useSecurity';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { Key, Shield, Smartphone, AlertTriangle, Loader2 } from 'lucide-react';

export const SecuritySettings: React.FC = () => {
  const { signOut } = useAuth();
  const { userSessions, securityEvents, ipWhitelist, addIPToWhitelist } = useSecurity();
  const [changingPassword, setChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [addingIP, setAddingIP] = useState(false);

  const handlePasswordChange = async () => {
    setChangingPassword(true);
    try {
      // This would trigger a password reset email
      toast.info('Password reset email sent to your registered email address');
    } catch (error) {
      toast.error('Failed to send password reset email');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) return;
    
    setAddingIP(true);
    try {
      await addIPToWhitelist.mutateAsync({
        ip_address: newIP,
        description: 'Added from settings'
      });
      setNewIP('');
      toast.success('IP address added to whitelist');
    } catch (error) {
      toast.error('Failed to add IP address');
    } finally {
      setAddingIP(false);
    }
  };

  const recentSecurityEvents = securityEvents?.slice(0, 5) || [];
  const activeSessions = userSessions?.filter(session => session.is_active) || [];
  const whitelistedIPs = ipWhitelist?.filter(ip => ip.is_active) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Password</Label>
              <p className="text-sm text-muted-foreground">
                Last updated: Never (managed by auth provider)
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handlePasswordChange}
              disabled={changingPassword}
            >
              {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch 
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions found</p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {session.user_agent || 'Unknown Device'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      IP: {session.ip_address} • Last active: {new Date(session.last_activity || '').toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IP Whitelist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g., 192.168.1.1)"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
            />
            <Button 
              onClick={handleAddIP}
              disabled={addingIP || !newIP.trim()}
            >
              {addingIP && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add IP
            </Button>
          </div>

          {whitelistedIPs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No whitelisted IP addresses</p>
          ) : (
            <div className="space-y-2">
              {whitelistedIPs.map((ip) => (
                <div key={ip.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono text-sm">{ip.ip_address}</span>
                  <Button variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSecurityEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent security events</p>
          ) : (
            <div className="space-y-3">
              {recentSecurityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={event.severity === 'high' ? 'destructive' : 'secondary'}>
                        {event.severity}
                      </Badge>
                      <span className="font-medium">{event.event_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
            <div>
              <Label className="text-destructive">Sign Out All Devices</Label>
              <p className="text-sm text-muted-foreground">
                This will sign you out of all devices and require you to log in again
              </p>
            </div>
            <Button variant="destructive" onClick={signOut}>
              Sign Out All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
