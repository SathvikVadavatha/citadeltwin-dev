
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Waves, 
  TreePine, 
  AlertTriangle, 
  MapPin, 
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { useAdvancedGIS } from '@/hooks/useAdvancedGIS';

export const EnvironmentalDataPanel = () => {
  const {
    environmentalLayers,
    isLoading,
    fetchEnvironmentalData,
    enableRealTimeUpdates,
    isFetching
  } = useAdvancedGIS();

  const [fetchParams, setFetchParams] = useState({
    city: '',
    state: '',
    dataTypes: [] as string[]
  });

  const handleDataTypeToggle = (dataType: string) => {
    setFetchParams(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(dataType)
        ? prev.dataTypes.filter(t => t !== dataType)
        : [...prev.dataTypes, dataType]
    }));
  };

  const handleFetchEnvironmentalData = async () => {
    if (!fetchParams.city || !fetchParams.state || fetchParams.dataTypes.length === 0) {
      return;
    }

    try {
      // Transform soils_wetlands to individual data types for the backend
      const dataTypes = fetchParams.dataTypes.includes('soils_wetlands') 
        ? fetchParams.dataTypes.filter(t => t !== 'soils_wetlands').concat(['soils', 'wetlands'])
        : fetchParams.dataTypes;

      await fetchEnvironmentalData({
        city: fetchParams.city,
        state: fetchParams.state,
        dataTypes: dataTypes
      });
    } catch (error) {
      console.error('Error fetching environmental data:', error);
    }
  };

  const handleToggleRealTime = async (layerId: string, enabled: boolean) => {
    if (enabled) {
      await enableRealTimeUpdates({ layerId, updateFrequency: 'hourly' });
    }
  };

  const getEnvironmentalIcon = (type: string) => {
    switch (type) {
      case 'flood_zones': return Waves;
      case 'soil_conditions':
      case 'soils': return TreePine;
      case 'wetlands': return Waves;
      case 'environmental': return Shield;
      case 'zoning': return MapPin;
      default: return AlertTriangle;
    }
  };

  const getEnvironmentalColor = (type: string) => {
    switch (type) {
      case 'flood_zones': return 'text-blue-500';
      case 'soil_conditions':
      case 'soils': return 'text-green-500';
      case 'wetlands': return 'text-teal-500';
      case 'environmental': return 'text-orange-500';
      case 'zoning': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Environmental Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fetch" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fetch">Fetch Data</TabsTrigger>
              <TabsTrigger value="manage">Manage Layers</TabsTrigger>
            </TabsList>

            <TabsContent value="fetch" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="env-city">City</Label>
                  <Input
                    id="env-city"
                    value={fetchParams.city}
                    onChange={(e) => setFetchParams(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Miami"
                    className="skeuo-button"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="env-state">State</Label>
                  <Input
                    id="env-state"
                    value={fetchParams.state}
                    onChange={(e) => setFetchParams(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g., FL"
                    className="skeuo-button"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Environmental Data Types</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'flood_zones', label: 'Flood Zones', icon: Waves, color: 'text-blue-500' },
                    { id: 'protected_lands', label: 'Protected Areas', icon: Shield, color: 'text-orange-500' },
                    { id: 'soils_wetlands', label: 'Soils & Wetlands', icon: TreePine, color: 'text-green-500' },
                    { id: 'zoning_data', label: 'Zoning Information', icon: MapPin, color: 'text-purple-500' }
                  ].map((dataType) => {
                    const IconComponent = dataType.icon;
                    return (
                      <div key={dataType.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={dataType.id}
                          checked={fetchParams.dataTypes.includes(dataType.id)}
                          onChange={() => handleDataTypeToggle(dataType.id)}
                          className="rounded border-border"
                        />
                        <label htmlFor={dataType.id} className="flex items-center gap-2 cursor-pointer">
                          <IconComponent className={`h-4 w-4 ${dataType.color}`} />
                          <span className="text-sm">{dataType.label}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button 
                onClick={handleFetchEnvironmentalData}
                disabled={isFetching || !fetchParams.city || !fetchParams.state || fetchParams.dataTypes.length === 0}
                className="skeuo-button w-full"
              >
                {isFetching ? 'Fetching Environmental Data...' : 'Fetch Environmental Data'}
              </Button>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              {environmentalLayers.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No environmental layers available. Fetch some data to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {environmentalLayers.map((layer) => {
                    const IconComponent = getEnvironmentalIcon(layer.layer_type);
                    const iconColor = getEnvironmentalColor(layer.layer_type);
                    
                    return (
                      <Card key={layer.id} className="gradient-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <IconComponent className={`h-5 w-5 ${iconColor} mt-0.5`} />
                              <div className="space-y-1">
                                <h4 className="font-medium text-foreground">{layer.layer_name}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{layer.layer_type.replace('_', ' ')}</Badge>
                                  {layer.environmental_type && (
                                    <Badge variant="outline">{layer.environmental_type}</Badge>
                                  )}
                                  <Badge variant="outline">{layer.feature_count} features</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Updated {new Date(layer.last_updated).toLocaleDateString()}
                                  </span>
                                  <span>Freshness: {layer.data_freshness_hours}h</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <Switch
                                  checked={layer.real_time_enabled}
                                  onCheckedChange={(checked) => handleToggleRealTime(layer.id, checked)}
                                  disabled={isFetching}
                                />
                                <span className="text-xs text-muted-foreground">Real-time</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
