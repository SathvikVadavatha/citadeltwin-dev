import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdvancedGIS } from '@/hooks/useAdvancedGIS';
import { LayerTogglePanel } from './LayerTogglePanel';
import { MapLegend } from './MapLegend';
import { FeatureTooltip } from './FeatureTooltip';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayerConfig {
  id: string;
  name: string;
  type: 'flood_zones' | 'soil_types' | 'protected_lands' | 'roads' | 'wetlands' | 'utilities';
  enabled: boolean;
  color: string;
  opacity: number;
  description: string;
}

interface FeatureInfo {
  title: string;
  properties: Record<string, any>;
  position: { lat: number; lng: number };
}

export const InteractiveGISMapCore: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<Map<string, google.maps.Polygon[]>>(new Map());
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(null);
  
  const { environmentalLayers, fetchEnvironmentalData, isFetching } = useAdvancedGIS();

  const [layers, setLayers] = useState<LayerConfig[]>([
    { 
      id: 'flood_zones', 
      name: 'FEMA Flood Zones', 
      type: 'flood_zones',
      enabled: false, 
      color: '#3B82F6',
      opacity: 0.4,
      description: 'Federal Emergency Management Agency flood risk areas'
    },
    { 
      id: 'protected_lands', 
      name: 'Protected Areas', 
      type: 'protected_lands',
      enabled: false, 
      color: '#10B981',
      opacity: 0.3,
      description: 'National parks, wildlife refuges, and conservation areas'
    },
    { 
      id: 'soil_types', 
      name: 'Soil Conditions', 
      type: 'soil_types',
      enabled: false, 
      color: '#8B4513',
      opacity: 0.3,
      description: 'Soil composition and engineering properties'
    },
    { 
      id: 'wetlands', 
      name: 'Wetlands', 
      type: 'wetlands',
      enabled: false, 
      color: '#4A90E2',
      opacity: 0.3,
      description: 'Wetland areas and water features'
    },
    { 
      id: 'utilities', 
      name: 'Utilities', 
      type: 'utilities',
      enabled: false, 
      color: '#FFA500',
      opacity: 0.7,
      description: 'Water, electric, and gas infrastructure'
    },
    { 
      id: 'roads', 
      name: 'Road Network', 
      type: 'roads',
      enabled: false, 
      color: '#666666',
      opacity: 0.8,
      description: 'Streets, highways, and transportation infrastructure'
    }
  ]);

  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setApiKeyError(null);

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

      // Default to Central Florida as requested
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 28.5383, lng: -81.3792 }, // Central Florida
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: false, // We'll handle this ourselves
        zoomControl: true,
        scaleControl: true,
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

      // Add click listener for feature information
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          handleMapClick(event.latLng.lat(), event.latLng.lng());
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setApiKeyError('Failed to initialize Google Maps. Please check the console for details.');
      setIsLoading(false);
      toast.error('Failed to load Google Maps. Please check your API key.');
    }
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    // Check if click intersects with any rendered features
    // For now, just show coordinates
    setSelectedFeature({
      title: 'Location Information',
      properties: {
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        'Click Info': 'Click on colored areas for feature details'
      },
      position: { lat, lng }
    });
  };

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, enabled: !layer.enabled }
        : layer
    ));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity }
        : layer
    ));
  };

  const clearAllOverlays = () => {
    overlaysRef.current.forEach(polygons => {
      polygons.forEach(polygon => polygon.setMap(null));
    });
    overlaysRef.current.clear();
  };

  const renderLayer = useCallback((layerConfig: LayerConfig) => {
    if (!mapInstanceRef.current) return;

    // Clear existing overlays for this layer
    const existingOverlays = overlaysRef.current.get(layerConfig.id) || [];
    existingOverlays.forEach(overlay => overlay.setMap(null));

    if (!layerConfig.enabled) {
      overlaysRef.current.set(layerConfig.id, []);
      return;
    }

    // Find matching environmental layer data
    const layerData = environmentalLayers.find(envLayer => 
      envLayer.layer_type === layerConfig.type
    );

    if (!layerData || !layerData.geometry_data) {
      console.log('No data available for layer:', layerConfig.name);
      return;
    }

    try {
      const geometryData = typeof layerData.geometry_data === 'string' 
        ? JSON.parse(layerData.geometry_data) 
        : layerData.geometry_data;

      if (!geometryData.features || !Array.isArray(geometryData.features)) {
        console.log('Invalid geometry data for layer:', layerConfig.name);
        return;
      }

      const newOverlays: google.maps.Polygon[] = [];

      geometryData.features.forEach((feature: any, index: number) => {
        if (!feature.geometry || !feature.geometry.coordinates) return;

        try {
          let paths: google.maps.LatLngLiteral[] = [];
          
          if (feature.geometry.type === 'Polygon') {
            paths = feature.geometry.coordinates[0].map((coord: [number, number]) => ({
              lat: coord[1],
              lng: coord[0]
            }));
          } else if (feature.geometry.type === 'MultiPolygon') {
            if (feature.geometry.coordinates[0] && feature.geometry.coordinates[0][0]) {
              paths = feature.geometry.coordinates[0][0].map((coord: [number, number]) => ({
                lat: coord[1],
                lng: coord[0]
              }));
            }
          }

          if (paths.length > 0) {
            const polygon = new google.maps.Polygon({
              paths: paths,
              strokeColor: layerConfig.color,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: layerConfig.color,
              fillOpacity: layerConfig.opacity,
            });

            polygon.setMap(mapInstanceRef.current);
            newOverlays.push(polygon);

            // Add click listener for feature info
            polygon.addListener('click', () => {
              setSelectedFeature({
                title: layerConfig.name,
                properties: feature.properties || {},
                position: paths[0]
              });
            });
          }
        } catch (featureError) {
          console.error(`Error rendering feature ${index} for layer ${layerConfig.name}:`, featureError);
        }
      });

      overlaysRef.current.set(layerConfig.id, newOverlays);
      
      if (newOverlays.length > 0) {
        toast.success(`Rendered ${newOverlays.length} features for ${layerConfig.name}`);
      }
    } catch (error) {
      console.error('Error parsing geometry data for layer:', layerConfig.name, error);
      toast.error(`Failed to render ${layerConfig.name} layer`);
    }
  }, [environmentalLayers]);

  // Effect to render layers when they change
  useEffect(() => {
    layers.forEach(layer => {
      renderLayer(layer);
    });
  }, [layers, renderLayer]);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
    return () => {
      clearAllOverlays();
    };
  }, [initializeMap]);

  const handleFetchGISData = async (location: string) => {
    try {
      await fetchEnvironmentalData({
        city: 'Orlando',
        state: 'FL',
        dataTypes: ['flood_zones', 'protected_lands']
      });
      toast.success('GIS data fetched successfully');
    } catch (error) {
      toast.error('Failed to fetch GIS data');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (apiKeyError) {
    return (
      <div className="h-96 bg-card border rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <h3 className="text-lg font-medium text-destructive mb-2">Map Loading Error</h3>
          <p className="text-muted-foreground">{apiKeyError}</p>
        </div>
      </div>
    );
  }

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-background"
    : "h-96 relative";

  return (
    <div className={containerClasses}>
      <div className="flex h-full">
        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading Interactive Map...</p>
              </div>
            </div>
          )}
          
          <div ref={mapRef} className="w-full h-full rounded-lg" />
          
          {/* Fullscreen Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 z-10"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Layer Controls Sidebar */}
        <div className="w-80 bg-card border-l p-4 overflow-y-auto">
          <LayerTogglePanel
            layers={layers}
            onToggleLayer={toggleLayer}
            onUpdateOpacity={updateLayerOpacity}
            onFetchData={handleFetchGISData}
            isFetching={isFetching}
          />
          
          <div className="mt-6">
            <MapLegend layers={layers.filter(l => l.enabled)} />
          </div>
        </div>
      </div>

      {/* Feature Tooltip */}
      {selectedFeature && (
        <FeatureTooltip
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </div>
  );
};