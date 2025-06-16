
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useSecurity } from '@/hooks/useSecurity';
import { Network, Plus, Shield, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const IPWhitelistPanel: React.FC = () => {
  const { ipWhitelist, ipWhitelistLoading, addIPToWhitelist } = useSecurity();
  const [isAdding, setIsAdding] = useState(false);
  const [newIP, setNewIP] = useState({
    ip_address: '',
    ip_range: '',
    description: ''
  });

  const validateIPAddress = (ip: string) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const validateCIDR = (cidr: string) => {
    if (!cidr) return true; // CIDR is optional
    const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
    return cidrRegex.test(cidr);
  };

  const handleAddIP = async () => {
    if (!newIP.ip_address || !validateIPAddress(newIP.ip_address)) return;
    if (newIP.ip_range && !validateCIDR(newIP.ip_range)) return;
    
    await addIPToWhitelist.mutateAsync(newIP);
    setNewIP({ ip_address: '', ip_range: '', description: '' });
    setIsAdding(false);
  };

  const getIPTypeIcon = (ip: string, range?: string) => {
    if (range) return <Network className="h-4 w-4 text-blue-500" />;
    return <Shield className="h-4 w-4 text-green-500" />;
  };

  if (ipWhitelistLoading) {
    return <div className="flex items-center justify-center h-32">Loading IP whitelist...</div>;
  }

  return (
    <div className="space-y-6">
      {/* IP Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total IPs</p>
                <p className="text-2xl font-bold">{ipWhitelist?.length || 0}</p>
              </div>
              <Network className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active IPs</p>
                <p className="text-2xl font-bold text-green-600">
                  {ipWhitelist?.filter(ip => ip.is_active).length || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">IP Ranges</p>
                <p className="text-2xl font-bold text-blue-600">
                  {ipWhitelist?.filter(ip => ip.ip_range).length || 0}
                </p>
              </div>
              <Network className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">IP Whitelist</h3>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add IP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add IP to Whitelist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">IP Address *</label>
                <Input
                  placeholder="192.168.1.1"
                  value={newIP.ip_address}
                  onChange={(e) => setNewIP({ ...newIP, ip_address: e.target.value })}
                />
                {newIP.ip_address && !validateIPAddress(newIP.ip_address) && (
                  <p className="text-sm text-red-500 mt-1">Invalid IP address format</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">IP Range (CIDR) - Optional</label>
                <Input
                  placeholder="192.168.1.0/24"
                  value={newIP.ip_range}
                  onChange={(e) => setNewIP({ ...newIP, ip_range: e.target.value })}
                />
                {newIP.ip_range && !validateCIDR(newIP.ip_range) && (
                  <p className="text-sm text-red-500 mt-1">Invalid CIDR format</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Description for this IP address or range"
                  value={newIP.description}
                  onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddIP} 
                  disabled={!newIP.ip_address || !validateIPAddress(newIP.ip_address) || (newIP.ip_range && !validateCIDR(newIP.ip_range))}
                >
                  Add IP
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* IP Whitelist */}
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {ipWhitelist?.map((ip) => (
            <Card key={ip.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getIPTypeIcon(ip.ip_address, ip.ip_range)}
                    <span className="font-medium">{ip.ip_address}</span>
                    {ip.ip_range && (
                      <Badge variant="outline">{ip.ip_range}</Badge>
                    )}
                    {ip.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  
                  {ip.description && (
                    <p className="text-sm text-muted-foreground mb-2">{ip.description}</p>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Added:</span> {format(new Date(ip.created_at), 'PPp')}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch checked={ip.is_active} />
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {(!ipWhitelist || ipWhitelist.length === 0) && (
            <div className="text-center text-muted-foreground py-8">
              No IP addresses in whitelist
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
