
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGISData } from "@/hooks/useGISData";
import { useToast } from "@/hooks/use-toast";
import { 
  Map, 
  Download, 
  RefreshCw, 
  MapPin, 
  Road, 
  Zap, 
  Layers, 
  Database,
  Calendar,
  Activity
} from "lucide-react";

export const GISDataManager = () => {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const { toast } = useToast();
  const { gisLayers, isLoading, fetchCityData, refreshLayer } = useGISData();

  const handleFetchData = async () => {
    if (!selectedCity) {
      toast({
        title: "City Required",
        description: "Please select a city to fetch GIS data.",
        variant: "destructive"
      });
      return;
    }

    try {
      await fetchCityData(selectedCity);
      toast({
        title: "GIS Data Fetched",
        description: `Successfully fetched GIS data for ${selectedCity}`,
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
      case 'roads': return Road;
      case 'utilities': return Zap;
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
    <div className="space-y-4">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-cyan-300 flex items-center gap-2">
            <Map className="w-5 h-5" />
            GIS Data Integration
          </CardTitle>
          <CardDescription className="text-gray-400">
            Fetch and manage municipal GIS data layers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Select City</label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                <SelectValue placeholder="Choose a city..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="nyc">New York City, NY</SelectItem>
                <SelectItem value="la">Los Angeles, CA</SelectItem>
                <SelectItem value="chicago">Chicago, IL</SelectItem>
                <SelectItem value="houston">Houston, TX</SelectItem>
                <SelectItem value="phoenix">Phoenix, AZ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleFetchData}
            disabled={isLoading || !selectedCity}
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
        </CardContent>
      </Card>

      {gisLayers.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-cyan-300 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Available GIS Layers
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage loaded GIS data layers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gisLayers.map((layer) => {
                const IconComponent = getLayerIcon(layer.layer_type);
                return (
                  <div 
                    key={layer.id} 
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <IconComponent className="w-5 h-5 text-cyan-400 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="font-medium text-gray-200">{layer.layer_name}</h4>
                          <p className="text-sm text-gray-400">{layer.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(layer.last_updated).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {formatFileSize(layer.data_size || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={
                            layer.status === 'active' 
                              ? "text-emerald-400 border-emerald-400" 
                              : "text-yellow-400 border-yellow-400"
                          }
                        >
                          {layer.status}
                        </Badge>
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

                    <Separator className="my-3 bg-gray-700" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Source:</span>
                        <p className="text-gray-200 truncate">{layer.source_url}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Features:</span>
                        <p className="text-gray-200">{layer.feature_count || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {gisLayers.length === 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Map className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-400 text-center">
              No GIS data loaded. Select a city and fetch data to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
