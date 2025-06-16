
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Plus, 
  Download, 
  Upload, 
  Key, 
  Plug,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { CreateIntegrationModal } from './CreateIntegrationModal';
import { APIKeysManager } from './APIKeysManager';
import { DataImportExportPanel } from './DataImportExportPanel';
import { PluginManager } from './PluginManager';

export const IntegrationsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { integrations, apiKeys, importJobs, exportJobs, loading, refetch } = useIntegrations();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const popularIntegrations = [
    {
      name: 'AutoCAD',
      type: 'CAD Software',
      description: 'Import/export DWG files and sync design data',
      logo: '🏗️',
      status: 'available'
    },
    {
      name: 'Revit',
      type: 'BIM Software',
      description: 'Connect to Autodesk Revit for BIM model synchronization',
      logo: '🏢',
      status: 'available'
    },
    {
      name: 'SketchUp',
      type: '3D Modeling',
      description: 'Import SketchUp models and collaborate on designs',
      logo: '📐',
      status: 'available'
    },
    {
      name: 'ETABS',
      type: 'Structural Analysis',
      description: 'Structural analysis software integration',
      logo: '🔧',
      status: 'coming_soon'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations & APIs</h1>
          <p className="text-muted-foreground">
            Connect with external tools and manage data import/export
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="data-transfer">Data Transfer</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Integrations</p>
                    <p className="text-2xl font-bold">{integrations.filter(i => i.status === 'active').length}</p>
                  </div>
                  <Plug className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">API Keys</p>
                    <p className="text-2xl font-bold">{apiKeys.length}</p>
                  </div>
                  <Key className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Import Jobs</p>
                    <p className="text-2xl font-bold">{importJobs.length}</p>
                  </div>
                  <Download className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Export Jobs</p>
                    <p className="text-2xl font-bold">{exportJobs.length}</p>
                  </div>
                  <Upload className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Integrations</CardTitle>
              <CardDescription>
                Connect with industry-standard engineering and design software
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {popularIntegrations.map((integration) => (
                  <Card key={integration.name} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="text-center space-y-2">
                        <div className="text-3xl">{integration.logo}</div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">{integration.type}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                        <Badge variant={integration.status === 'available' ? 'default' : 'secondary'}>
                          {integration.status === 'available' ? 'Available' : 'Coming Soon'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest import/export jobs and integration updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...importJobs.slice(0, 3), ...exportJobs.slice(0, 3)]
                  .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                  .slice(0, 5)
                  .map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {'source' in job ? (
                          <Download className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Upload className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {'source' in job ? `Import from ${job.source}` : `Export to ${job.target}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {job.format.toUpperCase()} • {new Date(job.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        {job.status === 'processing' && (
                          <Progress value={job.progress} className="w-20" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectors">
          <Card>
            <CardHeader>
              <CardTitle>Integration Connectors</CardTitle>
              <CardDescription>
                Manage your third-party software connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(integration.status)}
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {integration.provider} • {integration.type}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {integration.capabilities.slice(0, 3).map((cap) => (
                            <Badge key={cap} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
                
                {integrations.length === 0 && (
                  <div className="text-center py-8">
                    <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No integrations configured yet</p>
                    <Button onClick={() => setShowCreateModal(true)} className="mt-2">
                      Add Your First Integration
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <APIKeysManager />
        </TabsContent>

        <TabsContent value="data-transfer">
          <DataImportExportPanel />
        </TabsContent>

        <TabsContent value="plugins">
          <PluginManager />
        </TabsContent>
      </Tabs>

      <CreateIntegrationModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
};
