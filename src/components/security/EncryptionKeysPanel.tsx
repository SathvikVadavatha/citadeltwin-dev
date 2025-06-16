
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSecurity } from '@/hooks/useSecurity';
import { Key, Plus, RotateCcw, AlertTriangle } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

export const EncryptionKeysPanel: React.FC = () => {
  const { encryptionKeys, encryptionKeysLoading, createEncryptionKey } = useSecurity();
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState({
    key_name: '',
    key_type: 'aes256' as 'aes256' | 'rsa2048' | 'rsa4096',
    key_purpose: 'data' as 'data' | 'backup' | 'communication',
    rotation_schedule: 'quarterly'
  });

  const getKeyTypeInfo = (type: string) => {
    switch (type) {
      case 'aes256':
        return { name: 'AES-256', description: 'Advanced Encryption Standard 256-bit' };
      case 'rsa2048':
        return { name: 'RSA-2048', description: 'RSA 2048-bit key' };
      case 'rsa4096':
        return { name: 'RSA-4096', description: 'RSA 4096-bit key' };
      default:
        return { name: type.toUpperCase(), description: 'Encryption key' };
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'data': return 'text-blue-600';
      case 'backup': return 'text-green-600';
      case 'communication': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const isKeyExpiringSoon = (key: any) => {
    if (!key.next_rotation) return false;
    const rotationDate = parseISO(key.next_rotation);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return isAfter(thirtyDaysFromNow, rotationDate);
  };

  const handleCreateKey = async () => {
    if (!newKey.key_name) return;
    
    await createEncryptionKey.mutateAsync(newKey);
    setNewKey({ key_name: '', key_type: 'aes256', key_purpose: 'data', rotation_schedule: 'quarterly' });
    setIsCreating(false);
  };

  if (encryptionKeysLoading) {
    return <div className="flex items-center justify-center h-32">Loading encryption keys...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Keys</p>
                <p className="text-2xl font-bold">{encryptionKeys?.length || 0}</p>
              </div>
              <Key className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Keys</p>
                <p className="text-2xl font-bold text-green-600">
                  {encryptionKeys?.filter(key => key.is_active).length || 0}
                </p>
              </div>
              <Key className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">
                  {encryptionKeys?.filter(key => isKeyExpiringSoon(key)).length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AES-256 Keys</p>
                <p className="text-2xl font-bold text-blue-600">
                  {encryptionKeys?.filter(key => key.key_type === 'aes256').length || 0}
                </p>
              </div>
              <Key className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Encryption Keys</h3>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Encryption Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Key Name</label>
                <Input
                  placeholder="Enter key name"
                  value={newKey.key_name}
                  onChange={(e) => setNewKey({ ...newKey, key_name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Key Type</label>
                <Select value={newKey.key_type} onValueChange={(value: any) => setNewKey({ ...newKey, key_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select key type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aes256">AES-256</SelectItem>
                    <SelectItem value="rsa2048">RSA-2048</SelectItem>
                    <SelectItem value="rsa4096">RSA-4096</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Purpose</label>
                <Select value={newKey.key_purpose} onValueChange={(value: any) => setNewKey({ ...newKey, key_purpose: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data">Data Encryption</SelectItem>
                    <SelectItem value="backup">Backup Encryption</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Rotation Schedule</label>
                <Select value={newKey.rotation_schedule} onValueChange={(value) => setNewKey({ ...newKey, rotation_schedule: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rotation schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreateKey} disabled={!newKey.key_name}>
                  Create Key
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Encryption Keys List */}
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {encryptionKeys?.map((key) => {
            const typeInfo = getKeyTypeInfo(key.key_type);
            const expiringSoon = isKeyExpiringSoon(key);
            
            return (
              <Card key={key.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4" />
                      <span className="font-medium">{key.key_name}</span>
                      <Badge variant="outline">{typeInfo.name}</Badge>
                      <Badge variant="secondary" className={getPurposeColor(key.key_purpose)}>
                        {key.key_purpose}
                      </Badge>
                      {key.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {expiringSoon && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Created:</span> {format(new Date(key.created_at), 'PPp')}
                      </div>
                      <div>
                        <span className="font-medium">Last Rotated:</span> {format(new Date(key.last_rotated), 'PPp')}
                      </div>
                      {key.next_rotation && (
                        <div>
                          <span className="font-medium">Next Rotation:</span> {format(new Date(key.next_rotation), 'PPp')}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Schedule:</span> {key.rotation_schedule}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rotate
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {(!encryptionKeys || encryptionKeys.length === 0) && (
            <div className="text-center text-muted-foreground py-8">
              No encryption keys found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
