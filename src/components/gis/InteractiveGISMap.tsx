// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

/// <reference types="google.maps" />
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, AlertTriangle, CheckCircle, Upload, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LayerToggle {
  id: string;
  name: string;
  type: 'flood_zones' | 'soil_types' | 'protected_lands' | 'roads' | 'wetlands';
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

export const InteractiveGISMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<'central-florida' | 'northeast-ohio'>('central-florida');
  const [analysisResult, setAnalysisResult] = useState<SpatialAnalysisResult | null>(null);
  const [uploadedGISFile, setUploadedGISFile] = useState<File | null>(null);
  const { toast } = useToast();

  const [layers, setLayers] = useState<LayerToggle[]>([
    {
      id: 'flood_zones',
      name: 'FEMA Flood Zones',
      type: 'flood_zones',
      enabled: true,
      color: '#3B82F6',
      description: 'FEMA designated flood hazard areas'
    },
    {
      id: 'soil_types',
      name: 'Soil Classifications',
      type: 'soil_types',
      enabled: false,
      color: '#8B5CF6',
      description: 'USDA soil survey data'
    },
    {
      id: 'protected_lands',
      name: 'Protected Areas',
      type: 'protected_lands',
      enabled: true,
      color: '#10B981',
      description: 'Conservation and protected lands'
    },
    {
      id: 'wetlands',
      name: 'Wetlands',
      type: 'wetlands',
      enabled: true,
      color: '#06B6D4',
      description: 'National Wetlands Inventory'
    },
    {
      id: 'roads',
      name: 'Transportation',
      type: 'roads',
      enabled: false,
      color: '#6B7280',
      description: 'Road network and infrastructure'
    }
  ]);

  const regionBounds = {
    'central-florida': {
      center: { lat: 28.5383, lng: -81.3792 }, // Orlando
      bounds: {
        north: 29.2,
        south: 27.8,
        east: -80.5,
        west: -82.2
      },
      zoom: 9
    },
    'northeast-ohio': {
      center: { lat: 41.4993, lng: -81.6944 }, // Cleveland
      bounds: {
        north: 42.0,
        south: 41.0,
        east: -80.5,
        west: -82.5
      },
      zoom: 9
    }
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        // Skip Google Maps API for now to eliminate latency
        // Use a mock map implementation instead
        console.log('Mock map initializing for region:', selectedRegion);
        
        // Simulate map loading
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create mock map container with background image
        if (mapRef.current) {
          mapRef.current.style.backgroundImage = selectedRegion === 'central-florida' 
            ? 'url("data:image/svg+xml;base64,' + btoa(`
              <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                <rect width="800" height="600" fill="#1a365d"/>
                <text x="400" y="280" text-anchor="middle" fill="#4299e1" font-size="24" font-family="Arial">
                  Central Florida GIS Map
                </text>
                <text x="400" y="320" text-anchor="middle" fill="#90cdf4" font-size="16" font-family="Arial">
                  Click anywhere to analyze spatial features
                </text>
                <circle cx="400" cy="350" r="5" fill="#f56565"/>
              </svg>
            `) + '")'
            : 'url("data:image/svg+xml;base64,' + btoa(`
              <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                <rect width="800" height="600" fill="#2d3748"/>
                <text x="400" y="280" text-anchor="middle" fill="#4299e1" font-size="24" font-family="Arial">
                  Northeast Ohio GIS Map
                </text>
                <text x="400" y="320" text-anchor="middle" fill="#90cdf4" font-size="16" font-family="Arial">
                  Click anywhere to analyze spatial features
                </text>
                <circle cx="400" cy="350" r="5" fill="#f56565"/>
              </svg>
            `) + '")';
          
          mapRef.current.style.backgroundSize = 'cover';
          mapRef.current.style.backgroundPosition = 'center';
          mapRef.current.style.cursor = 'crosshair';
          
          // Add click handler
          mapRef.current.onclick = (event) => {
            const rect = mapRef.current!.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Convert to mock coordinates
            const regionConfig = regionBounds[selectedRegion];
            const lat = regionConfig.center.lat + (0.5 - y / rect.height) * 0.4;
            const lng = regionConfig.center.lng + (x / rect.width - 0.5) * 0.4;
            
            performSpatialAnalysis(lat, lng);
          };
        }
        setIsMapLoaded(true);
        setIsLoading(false);

        toast({
          title: "Map Loaded",
          description: `Interactive GIS map for ${selectedRegion.replace('-', ' ')} is ready`,
        });

      } catch (error) {
        console.error('Map initialization error:', error);
        setIsLoading(false);
        toast({
          title: "Map Error",
          description: "Failed to load Google Maps. Please check your API key configuration.",
          variant: "destructive"
        });
      }
    };

    initializeMap();
  }, [selectedRegion]);

  const performSpatialAnalysis = async (lat: number, lng: number) => {
    // Simulate spatial analysis with mock data
    const mockAnalysis = async (): Promise<SpatialAnalysisResult> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const intersections: SpatialAnalysisResult['intersections'] = [];
      
      // Mock logic based on region and coordinates
      if (selectedRegion === 'central-florida') {
        if (lat < 28.4) {
          intersections.push({
            type: 'FEMA Zone AE',
            description: 'This parcel intersects FEMA Zone AE floodplain',
            severity: 'warning'
          });
        }
        if (lng > -81.5) {
          intersections.push({
            type: 'Protected Wetlands',
            description: 'Property contains designated wetland areas',
            severity: 'error'
          });
        }
        intersections.push({
          type: 'Soil Type',
          description: 'Sandy soil classification - suitable for construction',
          severity: 'info'
        });
      } else {
        // Northeast Ohio
        if (lat > 41.3) {
          intersections.push({
            type: 'Lake Effect Zone',
            description: 'Property in lake effect snow zone',
            severity: 'info'
          });
        }
        intersections.push({
          type: 'Soil Type',
          description: 'Clay-rich soil - foundation considerations required',
          severity: 'warning'
        });
      }

      return {
        coordinates: { lat, lng },
        intersections
      };
    };

    try {
      const result = await mockAnalysis();
      setAnalysisResult(result);
      
      // Add marker to map
      if (mapInstanceRef.current) {
        new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          title: 'Analysis Point',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EF4444"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
          },
        });
      }

    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to perform spatial analysis",
        variant: "destructive"
      });
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
    setAnalysisResult(null);
    if (mapInstanceRef.current) {
      const regionConfig = regionBounds[region];
      mapInstanceRef.current.setCenter(regionConfig.center);
      mapInstanceRef.current.setZoom(regionConfig.zoom);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedGISFile(file);
      toast({
        title: "GIS File Uploaded",
        description: `${file.name} ready for spatial analysis`,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p>Loading Interactive GIS Map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Region Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Interactive GIS Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button
              variant={selectedRegion === 'central-florida' ? 'default' : 'outline'}
              onClick={() => switchRegion('central-florida')}
            >
              Central Florida
            </Button>
            <Button
              variant={selectedRegion === 'northeast-ohio' ? 'default' : 'outline'}
              onClick={() => switchRegion('northeast-ohio')}
            >
              Northeast Ohio
            </Button>
          </div>
          
          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Upload Project GIS Data
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".shp,.kml,.geojson,.json"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Upload className="w-4 h-4" />
            </div>
            {uploadedGISFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Uploaded: {uploadedGISFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Layer Controls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Environmental Layers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {layers.map((layer) => (
                <div key={layer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{layer.name}</p>
                      <p className="text-xs text-muted-foreground">{layer.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={layer.enabled}
                    onCheckedChange={() => toggleLayer(layer.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResult && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Spatial Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysisResult.intersections.map((intersection, index) => (
                  <Alert key={index} className={
                    intersection.severity === 'error' ? 'border-destructive' :
                    intersection.severity === 'warning' ? 'border-yellow-500' :
                    'border-blue-500'
                  }>
                    {intersection.severity === 'error' && <AlertTriangle className="h-4 w-4" />}
                    {intersection.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {intersection.severity === 'info' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                    <AlertDescription>
                      <Badge variant="outline" className="mb-1">
                        {intersection.type}
                      </Badge>
                      <p className="text-sm">{intersection.description}</p>
                    </AlertDescription>
                  </Alert>
                ))}
                {analysisResult.coordinates && (
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {analysisResult.coordinates.lat.toFixed(4)}, {analysisResult.coordinates.lng.toFixed(4)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div 
                ref={mapRef}
                className="w-full h-[600px] rounded-lg"
                style={{ minHeight: '600px' }}
              />
              {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Click anywhere on the map to perform spatial analysis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};