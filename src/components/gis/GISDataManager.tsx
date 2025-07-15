
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGISData } from "@/hooks/useGISData";
import { useToast } from "@/hooks/use-toast";
import { 
  Map, 
  Download, 
  RefreshCw, 
  MapPin, 
  Building, 
  Zap, 
  Layers, 
  Database,
  Calendar,
  Activity,
  Shield,
  Home
} from "lucide-react";
import { EnvironmentalDataPanel } from "./EnvironmentalDataPanel";
import { PropertyBoundaryViewer } from "./PropertyBoundaryViewer";
import { ZoningAnalysisPanel } from "./ZoningAnalysisPanel";
import { SpatialAnalysisPanel } from "./SpatialAnalysisPanel";
import { GISTestTrigger } from "@/components/test/GISTestTrigger";

export const GISDataManager = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const { toast } = useToast();
  const { gisLayers, isLoading, fetchCityData, refreshLayer } = useGISData();

  const handleFetchData = async () => {
    if (!selectedLocation) {
      toast({
        title: "Location Required",
        description: "Please select a location to fetch GIS data.",
        variant: "destructive"
      });
      return;
    }

    try {
      await fetchCityData(selectedLocation);
      toast({
        title: "GIS Data Fetched",
        description: `Successfully fetched GIS data for ${selectedLocation}`,
      });
    } catch (error) {
      toast({
        title: "Fetch Failed",
        description: "Failed to fetch GIS data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRefreshLayer = async (layerId: string) => {
    try {
      await refreshLayer(layerId);
      toast({
        title: "Layer Refreshed",
        description: "GIS layer data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh layer data.",
        variant: "destructive"
      });
    }
  };

  const getLayerIcon = (layerType: string) => {
    switch (layerType) {
      case 'parcels': return MapPin;
      case 'roads': return Building;
      case 'utilities': return Zap;
      case 'flood_zones': return Shield;
      case 'boundaries': return Home;
      default: return Layers;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-cyan-300 flex items-center gap-2">
            <Map className="w-5 h-5" />
            Advanced GIS Data Integration
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comprehensive GIS management with environmental data, property boundaries, and zoning analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic GIS</TabsTrigger>
              <TabsTrigger value="environmental">Environmental</TabsTrigger>
              <TabsTrigger value="boundaries">Boundaries</TabsTrigger>
              <TabsTrigger value="zoning">Zoning</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Select Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                    <SelectValue placeholder="Choose a city or county..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="nyc">New York City, NY</SelectItem>
                    <SelectItem value="la">Los Angeles, CA</SelectItem>
                    <SelectItem value="chicago">Chicago, IL</SelectItem>
                    <SelectItem value="houston">Houston, TX</SelectItem>
                    <SelectItem value="phoenix">Phoenix, AZ</SelectItem>
                    <SelectItem value="miami">Miami, FL</SelectItem>
                    <SelectItem value="seattle">Seattle, WA</SelectItem>
                    <SelectItem value="denver">Denver, CO</SelectItem>
                    <SelectItem value="austin">Austin, TX</SelectItem>
                    <SelectItem value="atlanta">Atlanta, GA</SelectItem>
                    <SelectItem value="cuyahoga">Cuyahoga County, OH</SelectItem>
                    <SelectItem value="orange-fl">Orange County, FL</SelectItem>
                    <SelectItem value="hillsborough-fl">Hillsborough County, FL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleFetchData}
                disabled={isLoading || !selectedLocation}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Fetching Data...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Fetch GIS Data
                  </>
                )}
              </Button>

              {gisLayers.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-cyan-300 font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Available GIS Layers ({gisLayers.length})
                  </h3>
                  {gisLayers.slice(0, 5).map((layer) => {
                    const IconComponent = getLayerIcon(layer.layer_type);
                    return (
                      <div 
                        key={layer.id} 
                        className="bg-gray-800 p-3 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium text-gray-200">{layer.layer_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {layer.feature_count} features
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefreshLayer(layer.id)}
                            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/20"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {gisLayers.length > 5 && (
                    <p className="text-sm text-gray-400 text-center">
                      ... and {gisLayers.length - 5} more layers
                    </p>
                  )}
                </div>
              )}

              <Separator className="my-6 bg-gray-700" />
              
              <div className="space-y-4">
                <h3 className="text-cyan-300 font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Test Data Ingestion
                </h3>
                <GISTestTrigger />
              </div>
            </TabsContent>

            <TabsContent value="environmental">
              <EnvironmentalDataPanel />
            </TabsContent>

            <TabsContent value="boundaries">
              <PropertyBoundaryViewer />
            </TabsContent>

            <TabsContent value="zoning">
              <ZoningAnalysisPanel />
            </TabsContent>

            <TabsContent value="analysis">
              <SpatialAnalysisPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
