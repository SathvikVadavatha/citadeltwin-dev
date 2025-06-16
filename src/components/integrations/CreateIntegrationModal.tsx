
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import type { IntegrationConfig } from '@/types/integrations';

interface CreateIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateIntegrationModal: React.FC<CreateIntegrationModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    provider: '',
    version: '',
    description: '',
    baseUrl: '',
    authType: '',
    capabilities: [] as string[],
  });
  const [newCapability, setNewCapability] = useState('');
  const { createIntegration } = useIntegrations();

  const integrationTypes = [
    { value: 'cad', label: 'CAD Software' },
    { value: 'bim', label: 'BIM Software' },
    { value: 'gis', label: 'GIS Platform' },
    { value: 'analysis', label: 'Analysis Tool' },
    { value: 'cloud', label: 'Cloud Service' },
    { value: 'documentation', label: 'Documentation' },
  ];

  const authTypes = [
    { value: 'api_key', label: 'API Key' },
    { value: 'oauth2', label: 'OAuth 2.0' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'basic', label: 'Basic Auth' },
  ];

  const commonCapabilities = [
    'import', 'export', 'sync', 'real-time', 'batch', 'webhooks',
    'file-transfer', 'model-validation', 'version-control', 'collaboration'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const integrationConfig: Omit<IntegrationConfig, 'id'> = {
      name: formData.name,
      type: formData.type as any,
      provider: formData.provider,
      version: formData.version,
      status: 'inactive',
      settings: {
        baseUrl: formData.baseUrl,
        authType: formData.authType,
        description: formData.description,
      },
      endpoints: [],
      dataFormats: [],
      capabilities: formData.capabilities,
    };

    const result = await createIntegration(integrationConfig);
    if (result) {
      onOpenChange(false);
      setFormData({
        name: '',
        type: '',
        provider: '',
        version: '',
        description: '',
        baseUrl: '',
        authType: '',
        capabilities: [],
      });
    }
  };

  const addCapability = () => {
    if (newCapability && !formData.capabilities.includes(newCapability)) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability]
      }));
      setNewCapability('');
    }
  };

  const removeCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(c => c !== capability)
    }));
  };

  const addCommonCapability = (capability: string) => {
    if (!formData.capabilities.includes(capability)) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, capability]
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Integration</DialogTitle>
          <DialogDescription>
            Configure a new integration with external software or services
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Integration Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., AutoCAD Integration"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="e.g., Autodesk"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Integration Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {integrationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="e.g., v1.0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this integration does..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.example.com"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authType">Authentication Type</Label>
              <Select value={formData.authType} onValueChange={(value) => setFormData(prev => ({ ...prev, authType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select auth type" />
                </SelectTrigger>
                <SelectContent>
                  {authTypes.map((auth) => (
                    <SelectItem key={auth.value} value={auth.value}>
                      {auth.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capabilities</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                placeholder="Add capability..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
              />
              <Button type="button" onClick={addCapability} variant="outline">
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {commonCapabilities.map((capability) => (
                <Badge
                  key={capability}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => addCommonCapability(capability)}
                >
                  {capability}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {formData.capabilities.map((capability) => (
                <Badge key={capability} variant="default" className="flex items-center gap-1">
                  {capability}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeCapability(capability)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Integration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
