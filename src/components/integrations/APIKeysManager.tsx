
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  EyeOff, 
  Key, 
  Plus, 
  Copy, 
  Trash2,
  Calendar,
  Shield
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from 'sonner';

export const APIKeysManager: React.FC = () => {
  const { apiKeys, createAPIKey } = useIntegrations();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    keyType: 'api_key',
    permissions: [],
  });

  const keyTypes = [
    { value: 'api_key', label: 'API Key' },
    { value: 'oauth_token', label: 'OAuth Token' },
    { value: 'jwt', label: 'JWT Token' },
    { value: 'bearer', label: 'Bearer Token' },
  ];

  const services = [
    'AutoCAD API',
    'Revit API',
    'SketchUp API',
    'Google Maps API',
    'OpenAI API',
    'Custom Service',
  ];

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const keyData = {
      ...formData,
      keyType: formData.keyType as any,
      isActive: true,
      permissions: formData.permissions,
    };

    const result = await createAPIKey(keyData);
    if (result) {
      setShowCreateForm(false);
      setFormData({
        name: '',
        service: '',
        keyType: 'api_key',
        permissions: [],
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const maskKey = (key: string) => {
    return key.length > 8 ? `${key.slice(0, 8)}${'*'.repeat(key.length - 12)}${key.slice(-4)}` : '*'.repeat(key.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your API keys for third-party integrations
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              Add a new API key for external service integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Key Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., AutoCAD Production Key"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select value={formData.service} onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyType">Key Type</Label>
                <Select value={formData.keyType} onValueChange={(value) => setFormData(prev => ({ ...prev, keyType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {keyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create API Key
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{apiKey.name}</h3>
                    <p className="text-sm text-muted-foreground">{apiKey.service}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{apiKey.keyType}</Badge>
                      <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                    {apiKey.lastUsed && (
                      <p>Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                  >
                    {visibleKeys.has(apiKey.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(visibleKeys.has(apiKey.id) ? 'full-key-here' : maskKey('sample-key'))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {visibleKeys.has(apiKey.id) && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">
                      Key is visible - keep it secure!
                    </span>
                  </div>
                  <code className="text-sm font-mono bg-background p-2 rounded border block">
                    {/* In real implementation, this would show the actual key */}
                    sk-1234567890abcdef1234567890abcdef12345678
                  </code>
                </div>
              )}

              {apiKey.permissions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {apiKeys.length === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to connect with external services
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
