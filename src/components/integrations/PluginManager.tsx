
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Puzzle, 
  Download, 
  Upload, 
  Settings, 
  Trash2,
  Search,
  Star,
  Shield,
  Code,
  ExternalLink
} from 'lucide-react';

export const PluginManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('marketplace');

  const marketplacePlugins = [
    {
      id: '1',
      name: 'AutoCAD Sync Pro',
      version: '2.1.0',
      author: 'CitadelTwin Team',
      category: 'cad',
      description: 'Advanced AutoCAD integration with real-time sync and version control',
      rating: 4.8,
      downloads: 1250,
      price: 'Free',
      features: ['Real-time sync', 'Version control', 'Batch operations'],
      isInstalled: false,
    },
    {
      id: '2',
      name: 'Structural Analysis Toolkit',
      version: '1.5.2',
      author: 'Engineering Solutions Inc.',
      category: 'analysis',
      description: 'Enhanced FEA capabilities with advanced material modeling',
      rating: 4.6,
      downloads: 890,
      price: '$29/month',
      features: ['Advanced FEA', 'Material modeling', 'Report generation'],
      isInstalled: true,
    },
    {
      id: '3',
      name: 'Compliance Checker Plus',
      version: '3.0.1',
      author: 'RegTech Solutions',
      category: 'workflow',
      description: 'Automated compliance checking for multiple international codes',
      rating: 4.9,
      downloads: 2100,
      price: '$49/month',
      features: ['Multi-jurisdiction', 'Auto-updates', 'Custom rules'],
      isInstalled: false,
    },
    {
      id: '4',
      name: 'Report Designer Pro',
      version: '1.2.0',
      author: 'DocGen Studios',
      category: 'reporting',
      description: 'Professional report templates and custom document generation',
      rating: 4.5,
      downloads: 567,
      price: '$19/month',
      features: ['Custom templates', 'Branding', 'Export options'],
      isInstalled: true,
    },
  ];

  const installedPlugins = marketplacePlugins.filter(p => p.isInstalled);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cad':
        return '🏗️';
      case 'analysis':
        return '🔬';
      case 'workflow':
        return '⚙️';
      case 'reporting':
        return '📊';
      default:
        return '🧩';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cad':
        return 'bg-blue-100 text-blue-800';
      case 'analysis':
        return 'bg-green-100 text-green-800';
      case 'workflow':
        return 'bg-purple-100 text-purple-800';
      case 'reporting':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPlugins = marketplacePlugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plugin Manager</h2>
          <p className="text-muted-foreground">
            Extend CitadelTwin with custom plugins and integrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Plugin
          </Button>
          <Button>
            <Code className="h-4 w-4 mr-2" />
            Developer Tools
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'marketplace'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'installed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Installed ({installedPlugins.length})
        </button>
        <button
          onClick={() => setActiveTab('develop')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'develop'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Developer
        </button>
      </div>

      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlugins.map((plugin) => (
              <Card key={plugin.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(plugin.category)}</span>
                      <div>
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">by {plugin.author}</p>
                      </div>
                    </div>
                    {plugin.isInstalled && (
                      <Badge variant="default" className="text-xs">
                        Installed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{plugin.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(plugin.category)} variant="secondary">
                      {plugin.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {plugin.rating}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {plugin.downloads} downloads
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {plugin.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-semibold text-primary">{plugin.price}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      <Button size="sm" disabled={plugin.isInstalled}>
                        {plugin.isInstalled ? (
                          'Installed'
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Install
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'installed' && (
        <div className="space-y-4">
          {installedPlugins.map((plugin) => (
            <Card key={plugin.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{getCategoryIcon(plugin.category)}</span>
                    <div>
                      <h3 className="font-semibold">{plugin.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        v{plugin.version} • by {plugin.author}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {plugin.features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Enabled</span>
                      <Switch defaultChecked />
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {installedPlugins.length === 0 && (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Plugins Installed</h3>
                <p className="text-muted-foreground mb-4">
                  Browse the marketplace to find plugins that extend CitadelTwin's capabilities
                </p>
                <Button onClick={() => setActiveTab('marketplace')}>
                  Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'develop' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Plugin Development
              </CardTitle>
              <CardDescription>
                Tools and resources for developing custom plugins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Code className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold mb-1">Plugin SDK</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download the SDK and documentation
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Download SDK
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold mb-1">Plugin Validator</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test and validate your plugins
                    </p>
                    <Button variant="outline" size="sm">
                      <Upload className="h-3 w-3 mr-1" />
                      Validate Plugin
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Getting Started</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Download the Plugin SDK and documentation</li>
                  <li>Create your plugin using the provided templates</li>
                  <li>Test your plugin with the validator tool</li>
                  <li>Submit for review in the marketplace</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
