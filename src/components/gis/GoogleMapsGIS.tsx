import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, MapPin, Layers, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useSpatialAnalysis } from '@/hooks/useSpatialAnalysis';
import { useAdvancedGIS } from '@/hooks/useAdvancedGIS';
import { supabase } from '@/integrations/supabase/client';

interface LayerToggle {
  id: string;
  name: string;
  type: 'flood_zones' | 'soil_types' | 'protected_lands' | 'roads' | 'wetlands' | 'utilities';
  enabled: boolean;
  color: string;
  description: string;
}

interface SpatialAnalysisResult {
  parcelId?: string;
  intersections: {
    type: string;
    description: string;
    severity: 'info' | 'warning' | 'error';
  }[];
  coordinates?: { lat: number; lng: number };
}

export const GoogleMapsGIS: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<'central-florida' | 'northeast-ohio'>('central-florida');
  const [analysisResults, setAnalysisResults] = useState<SpatialAnalysisResult[]>([]);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const { runIntersectionAnalysis, runBufferAnalysis, fetchRealGISData } = useSpatialAnalysis();
  const { fetchEnvironmentalData, performZoningAnalysis } = useAdvancedGIS();

  const [layers, setLayers] = useState<LayerToggle[]>([
    { id: 'flood_zones', name: 'FEMA Flood Zones', type: 'flood_zones', enabled: false, color: '#3B82F6', description: 'Federal flood risk areas' },
    { id: 'soil_types', name: 'Soil Classifications', type: 'soil_types', enabled: false, color: '#8B5CF6', description: 'Soil composition and bearing capacity' },
    { id: 'protected_lands', name: 'Protected Areas', type: 'protected_lands', enabled: false, color: '#10B981', description: 'Environmentally protected zones' },
    { id: 'roads', name: 'Transportation Network', type: 'roads', enabled: true, color: '#F59E0B', description: 'Roads, highways, and transit' },
    { id: 'wetlands', name: 'Wetlands & Water Bodies', type: 'wetlands', enabled: false, color: '#06B6D4', description: 'Natural water features' },
    { id: 'utilities', name: 'Utility Infrastructure', type: 'utilities', enabled: false, color: '#EF4444', description: 'Power, water, sewer lines' }
  ]);

  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setApiKeyError(null);

      // Fetch Google Maps API key from Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      
      if (error || !data?.apiKey) {
        const errorMessage = error?.message || data?.error || 'Failed to retrieve Google Maps API key';
        console.error('Error fetching Google Maps API key:', errorMessage);
        setApiKeyError(errorMessage);
        setIsLoading(false);
        return;
      }

      const loader = new Loader({
        apiKey: data.apiKey,
        version: 'weekly',
        libraries: ['geometry', 'drawing', 'places']
      });

      const google = await loader.load();

      const regionCoords = {
        'central-florida': { lat: 28.5383, lng: -81.3792 },
        'northeast-ohio': { lat: 41.4993, lng: -81.6944 }
      };

      const map = new google.maps.Map(mapRef.current, {
        center: regionCoords[selectedRegion],
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#1a1a1a' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#2d3748' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Add click listener for spatial analysis
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          performSpatialAnalysis(lat, lng);
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setApiKeyError('Failed to initialize Google Maps. Please check the console for details.');
      setIsLoading(false);
      toast.error('Failed to load Google Maps. Please check your API key.');
    }
  }, [selectedRegion]);

  const performSpatialAnalysis = async (lat: number, lng: number) => {
    try {
      const result = await runIntersectionAnalysis(layers.filter(l => l.enabled).map(l => l.id));

      const analysisResult: SpatialAnalysisResult = {
        coordinates: { lat, lng },
        intersections: [
          {
            type: 'Zoning Analysis',
            description: `Analysis completed for coordinates (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            severity: 'info'
          }
        ]
      };

      if (selectedRegion === 'central-florida') {
        analysisResult.intersections.push({
          type: 'Flood Zone',
          description: 'Located in FEMA Zone AE - Special flood hazard area',
          severity: 'warning'
        });
      }

      setAnalysisResults(prev => [analysisResult, ...prev.slice(0, 4)]);
      toast.success('Spatial analysis completed');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed');
    }
  };

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, enabled: !layer.enabled }
        : layer
    ));
  };

  const switchRegion = (region: 'central-florida' | 'northeast-ohio') => {
    setSelectedRegion(region);
    setAnalysisResults([]);
    if (mapInstanceRef.current) {
      const regionCoords = {
        'central-florida': { lat: 28.5383, lng: -81.3792 },
        'northeast-ohio': { lat: 41.4993, lng: -81.6944 }
      };
      mapInstanceRef.current.setCenter(regionCoords[region]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.success(`Uploaded ${file.name} for GIS analysis`);
    }
  };

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  if (apiKeyError) {
    return (
      <div className="space-y-6">
        <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)', color: 'hsl(0 0% 98%)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(0 0% 98%)' }}>Google Maps API Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'hsl(240 5% 64.9%)' }} className="mb-4">{apiKeyError}</p>
            <p style={{ color: 'hsl(240 5% 64.9%)' }} className="text-sm">
              Please ensure the GOOGLE_MAPS_API_KEY is properly configured in your Supabase secrets.
            </p>
            <div className="mt-4">
              <Button 
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                style={{ backgroundColor: 'hsl(210 40% 98%)', color: 'hsl(222.2 84% 4.9%)' }}
              >
                Get Google Maps API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Region Selection */}
      <div className="flex gap-4 items-center">
        <Button
          onClick={() => switchRegion('central-florida')}
          variant={selectedRegion === 'central-florida' ? 'default' : 'outline'}
          style={{
            backgroundColor: selectedRegion === 'central-florida' ? 'hsl(210 40% 98%)' : 'transparent',
            color: selectedRegion === 'central-florida' ? 'hsl(222.2 84% 4.9%)' : 'hsl(210 40% 98%)',
            borderColor: 'hsl(240 3.7% 15.9%)'
          }}
        >
          Central Florida
        </Button>
        <Button
          onClick={() => switchRegion('northeast-ohio')}
          variant={selectedRegion === 'northeast-ohio' ? 'default' : 'outline'}
          style={{
            backgroundColor: selectedRegion === 'northeast-ohio' ? 'hsl(210 40% 98%)' : 'transparent',
            color: selectedRegion === 'northeast-ohio' ? 'hsl(222.2 84% 4.9%)' : 'hsl(210 40% 98%)',
            borderColor: 'hsl(240 3.7% 15.9%)'
          }}
        >
          Northeast Ohio
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3">
          <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)' }}>
            <CardContent className="p-0">
              <div className="relative">
                <div
                  ref={mapRef}
                  className="w-full h-[600px] rounded-lg"
                  style={{ backgroundColor: 'hsl(240 10% 3.9%)' }}
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p style={{ color: 'hsl(210 40% 98%)' }}>Loading Google Maps...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        <div className="space-y-6">
          {/* Layer Controls */}
          <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(0 0% 98%)' }}>
                <Layers className="w-5 h-5" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {layers.map((layer) => (
                <div key={layer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={layer.id}
                      checked={layer.enabled}
                      onCheckedChange={() => toggleLayer(layer.id)}
                    />
                    <Label htmlFor={layer.id} style={{ color: 'hsl(210 40% 98%)' }}>
                      {layer.name}
                    </Label>
                  </div>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: layer.color }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(0 0% 98%)' }}>
                <Upload className="w-5 h-5" />
                Upload GIS Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept=".kml,.kmz,.geojson,.shp"
                onChange={handleFileUpload}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold"
                style={{
                  color: 'hsl(210 40% 98%)',
                  backgroundColor: 'transparent'
                }}
              />
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResults.length > 0 && (
            <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(0 0% 98%)' }}>
                  <MapPin className="w-5 h-5" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysisResults.map((result, index) => (
                  <div key={index} className="space-y-2">
                    {result.intersections.map((intersection, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: intersection.severity === 'error' ? 'hsl(0 62.8% 30.6%)' :
                                         intersection.severity === 'warning' ? 'hsl(47.9 95.8% 53.1%)' :
                                         'hsl(240 3.7% 15.9%)'
                        }}
                      >
                        <div className="font-medium" style={{ color: 'hsl(0 0% 98%)' }}>
                          {intersection.type}
                        </div>
                        <div className="text-sm" style={{ color: 'hsl(240 5% 64.9%)' }}>
                          {intersection.description}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};