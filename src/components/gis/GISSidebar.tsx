import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  MapPin, 
  Download, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Image,
  File,
  BarChart3,
  AlertTriangle,
  Shield,
  Droplets,
  Info
} from 'lucide-react';
import { useGISExport } from '@/hooks/useGISExport';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LayerToggle {
  id: string;
  name: string;
  type: 'flood_zones' | 'soil_types' | 'protected_lands' | 'roads' | 'wetlands' | 'utilities' | 'soils';
  enabled: boolean;
  color: string;
  description: string;
}

interface GISSidebarProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  mapInstance?: google.maps.Map | null;
  selectedProperty?: {
    place: google.maps.places.PlaceResult;
    location: google.maps.LatLng;
  } | null;
  combinedAnalysis?: {
    floodZones: string[];
    protectedAreas: string[];
    soilsWetlands: string[];
  };
  selectedRegion: 'central-florida' | 'northeast-ohio';
  layers: LayerToggle[];
  onToggleLayer: (layerId: string) => void;
  environmentalLayers: any[];
  isFetching: boolean;
}

export const GISSidebar: React.FC<GISSidebarProps> = ({
  isCollapsed,
  onToggleCollapsed,
  mapInstance,
  selectedProperty,
  combinedAnalysis,
  selectedRegion,
  layers,
  onToggleLayer,
  environmentalLayers,
  isFetching
}) => {
  const [activeTab, setActiveTab] = useState('layers');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [imageQuality, setImageQuality] = useState<'standard' | 'high' | 'print'>('high');
  
  const {
    isExporting,
    exportMapAsImage,
    exportAnalysisAsCSV,
    exportAnalysisAsPDF
  } = useGISExport();

  const exportData = {
    selectedProperty,
    combinedAnalysis,
    selectedRegion,
    layers
  };

  const hasAnalysisData = selectedProperty && combinedAnalysis && (
    combinedAnalysis.floodZones.length > 0 ||
    combinedAnalysis.protectedAreas.length > 0 ||
    combinedAnalysis.soilsWetlands.length > 0
  );

  const handleMapImageExport = () => {
    if (!mapInstance) return;
    
    // Build active layers list with data
    const activeLayers = [];
    if (combinedAnalysis?.floodZones && combinedAnalysis.floodZones.length > 0) {
      activeLayers.push({ name: 'Flood Zones', color: 'rgb(0, 102, 204)' });
    }
    if (combinedAnalysis?.protectedAreas && combinedAnalysis.protectedAreas.length > 0) {
      activeLayers.push({ name: 'Protected Areas', color: 'rgb(147, 51, 234)' });
    }
    if (combinedAnalysis?.soilsWetlands && combinedAnalysis.soilsWetlands.length > 0) {
      activeLayers.push({ name: 'Soils & Wetlands', color: 'rgb(217, 179, 140)' });
    }
    
    exportMapAsImage(mapInstance, imageFormat, imageQuality, undefined, activeLayers);
  };

  const getRiskLevel = () => {
    if (!combinedAnalysis) return 'Unknown';
    
    const hasHighRiskFlood = combinedAnalysis.floodZones.some(zone => 
      zone.includes('High') || zone.includes('VE') || zone.includes('AE')
    );
    const hasProtectedAreas = combinedAnalysis.protectedAreas.length > 0;
    const hasWetlands = combinedAnalysis.soilsWetlands.some(soil => 
      soil.toLowerCase().includes('wetland') || soil.toLowerCase().includes('hydric')
    );
    
    if (hasHighRiskFlood && (hasProtectedAreas || hasWetlands)) return 'Critical';
    if (hasHighRiskFlood || (hasProtectedAreas && hasWetlands)) return 'High';
    if (hasProtectedAreas || hasWetlands) return 'Moderate';
    return 'Low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'hsl(0 70% 50%)';
      case 'High': return 'hsl(15 80% 55%)';
      case 'Moderate': return 'hsl(45 90% 60%)';
      case 'Low': return 'hsl(120 50% 50%)';
      default: return 'hsl(240 5% 64.9%)';
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 space-y-4 w-14 border-r border-border bg-card/50">
        <Button
          onClick={onToggleCollapsed}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col space-y-2">
          <Button
            onClick={() => {
              onToggleCollapsed();
              setActiveTab('layers');
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Map Layers"
          >
            <Layers className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => {
              onToggleCollapsed();
              setActiveTab('analysis');
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Analysis Results"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => {
              onToggleCollapsed();
              setActiveTab('export');
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Export Options"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => {
              onToggleCollapsed();
              setActiveTab('settings');
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {hasAnalysisData && (
          <div className="mt-4">
            <div 
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
              style={{ 
                borderColor: getRiskColor(getRiskLevel()),
                backgroundColor: `${getRiskColor(getRiskLevel())}20`
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getRiskColor(getRiskLevel()) }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("w-80 h-fit bg-card/95 backdrop-blur-sm", isCollapsed && "w-14")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1 rounded bg-primary/10">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            GIS Analysis
          </CardTitle>
          <Button
            onClick={onToggleCollapsed}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Risk Level Indicator */}
        {hasAnalysisData && (
          <div className="p-3 rounded-lg border-2" style={{ 
            borderColor: getRiskColor(getRiskLevel()),
            backgroundColor: `${getRiskColor(getRiskLevel())}10`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: getRiskColor(getRiskLevel()) }} />
                <span className="font-medium text-sm">Risk Level</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 cursor-help opacity-60 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-2 text-xs">
                        <p className="font-semibold">Risk Model Calculation:</p>
                        <ul className="space-y-1 pl-2">
                          <li><strong>Critical:</strong> High-risk flood zone + (protected areas OR wetlands)</li>
                          <li><strong>High:</strong> High-risk flood zone OR (protected areas AND wetlands)</li>
                          <li><strong>Moderate:</strong> Protected areas OR wetlands present</li>
                          <li><strong>Low:</strong> None of the above conditions</li>
                        </ul>
                        <p className="text-muted-foreground mt-2">Based on real GIS analysis of environmental factors</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline" style={{ 
                borderColor: getRiskColor(getRiskLevel()),
                color: getRiskColor(getRiskLevel())
              }}>
                {getRiskLevel()}
              </Badge>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger 
              value="layers" 
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Layers className="w-3 h-3 mr-1" />
              Layers
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Layers Tab */}
          <TabsContent value="layers" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground/90">Environmental Data Layers</h4>
              
              {layers.map((layer) => {
                const layerData = environmentalLayers.find(envLayer => 
                  envLayer.layer_type === layer.type &&
                  (selectedRegion === 'central-florida' ? 
                    envLayer.city.toLowerCase().includes('orlando') : 
                    envLayer.city.toLowerCase().includes('cleveland'))
                );
                
                return (
                  <div key={layer.id} className="space-y-2 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Switch
                          id={layer.id}
                          checked={layer.enabled}
                          onCheckedChange={() => onToggleLayer(layer.id)}
                          disabled={isFetching && layer.id === 'flood_zones'}
                        />
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: layer.color }}
                          />
                          <Label htmlFor={layer.id} className="text-sm font-medium">
                            {layer.name}
                          </Label>
                        </div>
                      </div>
                      {layer.enabled && (
                        <div className="flex gap-1">
                          {layer.id.includes('flood') && <Droplets className="w-3 h-3 text-blue-500" />}
                          {layer.id.includes('protected') && <Shield className="w-3 h-3 text-green-500" />}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground pl-6">
                      {layer.description}
                      {layerData && layerData.metadata?.last_updated && (
                        <span className="block mt-1">
                          Updated: {new Date(layerData.metadata.last_updated).toLocaleDateString()}
                        </span>
                      )}
                      {isFetching && layer.id === 'flood_zones' && (
                        <span className="block mt-1 text-blue-400">Loading...</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Analysis Results */}
            {selectedProperty && (
              <div className="space-y-4 mt-6">
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground/90 mb-3">Analysis Results</h4>
                  
                  <div className="p-3 rounded-lg bg-muted/30 mb-3">
                    <h5 className="font-medium text-sm mb-2">Selected Property</h5>
                    <p className="text-xs text-muted-foreground">
                      {selectedProperty.place.name || selectedProperty.place.formatted_address}
                    </p>
                  </div>

                  {combinedAnalysis && (
                    <div className="space-y-3">
                      {combinedAnalysis.floodZones.length > 0 && (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(217 91% 15%)', border: '1px solid hsl(217 91% 25%)' }}>
                          <h5 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'hsl(217 91% 75%)' }}>
                            <Droplets className="w-4 h-4" />
                            FEMA Flood Zones
                          </h5>
                          <div className="text-xs space-y-1" style={{ color: 'hsl(217 91% 65%)' }}>
                            {combinedAnalysis.floodZones.map((zone, index) => (
                              <div key={index} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{zone}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {combinedAnalysis.protectedAreas.length > 0 && (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(142 51% 15%)', border: '1px solid hsl(142 51% 25%)' }}>
                          <h5 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'hsl(142 51% 75%)' }}>
                            <Shield className="w-4 h-4" />
                            Protected Areas
                          </h5>
                          <div className="text-xs space-y-1" style={{ color: 'hsl(142 51% 65%)' }}>
                            {combinedAnalysis.protectedAreas.map((area, index) => (
                              <div key={index} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{area}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {combinedAnalysis.soilsWetlands.length > 0 && (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(30 51% 15%)', border: '1px solid hsl(30 51% 25%)' }}>
                          <h5 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'hsl(30 51% 75%)' }}>
                            <div className="w-4 h-4 rounded bg-orange-200 flex items-center justify-center">
                              <div className="w-2 h-2 rounded bg-orange-600" />
                            </div>
                            Soils & Wetlands
                          </h5>
                          <div className="text-xs space-y-1" style={{ color: 'hsl(30 51% 65%)' }}>
                            {combinedAnalysis.soilsWetlands.map((soil, index) => (
                              <div key={index} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{soil}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Analysis Tab - Remove since we moved content to layers */}
          
          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Map Export */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Map Export</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <Select value={imageFormat} onValueChange={(value: 'png' | 'jpeg') => setImageFormat(value)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={imageQuality} onValueChange={(value: 'standard' | 'high' | 'print') => setImageQuality(value)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="print">Print Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={handleMapImageExport}
                  disabled={isExporting || !mapInstance}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  <Image className="w-3 h-3 mr-1" />
                  Export Map Image
                </Button>
              </div>

              {/* Analysis Export */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Analysis Reports</h4>
                
                <div className="grid gap-2">
                  <Button
                    onClick={() => exportAnalysisAsPDF(exportData, mapInstance || undefined)}
                    disabled={isExporting || !hasAnalysisData}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start"
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    Comprehensive PDF Report
                  </Button>
                  
                  <Button
                    onClick={() => exportAnalysisAsCSV(exportData)}
                    disabled={isExporting || !hasAnalysisData}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start"
                  >
                    <File className="w-3 h-3 mr-2" />
                    Detailed CSV Data
                  </Button>
                </div>
              </div>

              {/* Export Status */}
              {isExporting && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-xs text-blue-400">Generating export...</span>
                </div>
              )}

              {!hasAnalysisData && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Select and analyze a property to enable detailed exports
                </p>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Display Options</h4>
                <div className="text-xs text-muted-foreground">
                  Map display and rendering settings will be available in a future update.
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Data Sources</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• FEMA National Flood Hazard Layer</div>
                  <div>• USGS Protected Areas Database</div>
                  <div>• USDA NRCS Soil Survey</div>
                  <div>• USFWS National Wetlands Inventory</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Analysis Version</h4>
                <Badge variant="secondary" className="text-xs">v2.0 Enhanced</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};