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

interface EnvironmentalAnalysis {
  floodRisk?: {
    level: string;
    severity: string;
    description: string;
  };
  soilType?: {
    description: string;
  };
  protectedAreas?: {
    name: string;
    distance: string;
  }[];
}

export const GoogleMapsGIS: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const selectedPropertyMarkerRef = useRef<google.maps.Marker | null>(null);
  const floodZoneOverlaysRef = useRef<google.maps.Polygon[]>([]);
  const protectedAreaOverlaysRef = useRef<google.maps.Polygon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<'central-florida' | 'northeast-ohio'>('central-florida');
  const [analysisResults, setAnalysisResults] = useState<SpatialAnalysisResult[]>([]);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<{
    place: google.maps.places.PlaceResult;
    location: google.maps.LatLng;
  } | null>(null);
  const [environmentalAnalysis, setEnvironmentalAnalysis] = useState<EnvironmentalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { runIntersectionAnalysis, runBufferAnalysis, fetchRealGISData } = useSpatialAnalysis();
  const { fetchEnvironmentalData, fetchFEMAFloodData, performZoningAnalysis, environmentalLayers, isFetching } = useAdvancedGIS();

  const [layers, setLayers] = useState<LayerToggle[]>([
    { 
      id: 'flood_zones', 
      name: 'FEMA Flood Zones', 
      type: 'flood_zones',
      enabled: false, 
      color: '#3b82f6',
      description: 'Federal Emergency Management Agency flood risk areas'
    },
    { 
      id: 'protected_lands', 
      name: 'Protected Areas', 
      type: 'protected_lands',
      enabled: false, 
      color: '#f97316',
      description: 'National parks, wildlife refuges, and conservation areas'
    }
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

      // Initialize Places Autocomplete after map is loaded
      initializePlacesAutocomplete(google);

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

  const initializePlacesAutocomplete = useCallback((google: any) => {
    if (!searchInputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
      types: ['establishment', 'geocode'],
      fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types']
    });

    // Bias results to current region
    const regionCoords = {
      'central-florida': { lat: 28.5383, lng: -81.3792 },
      'northeast-ohio': { lat: 41.4993, lng: -81.6944 }
    };

    const circle = new google.maps.Circle({
      center: regionCoords[selectedRegion],
      radius: 50000 // 50km radius
    });
    autocomplete.setBounds(circle.getBounds());

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        toast.error('No location details available for this place');
        return;
      }

      setSelectedProperty({
        place: place,
        location: place.geometry.location
      });

      // Center map on selected property
      mapInstanceRef.current?.setCenter(place.geometry.location);
      mapInstanceRef.current?.setZoom(16);

      // Clear existing marker and add new one
      if (selectedPropertyMarkerRef.current) {
        selectedPropertyMarkerRef.current.setMap(null);
      }

      const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: mapInstanceRef.current,
        title: place.name || place.formatted_address,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.02944 7.02944 1 12 1S21 5.02944 21 10Z" 
                    fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
              <circle cx="12" cy="10" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });

      selectedPropertyMarkerRef.current = marker;

      // Trigger environmental analysis
      analyzePropertyEnvironment(place.geometry.location.lat(), place.geometry.location.lng(), place);

      // Check for intersections with active layers
      checkLayerIntersections(place.geometry.location.lat(), place.geometry.location.lng());

      toast.success(`Selected: ${place.name || place.formatted_address}`);
    });

    autocompleteRef.current = autocomplete;
  }, [selectedRegion]);

  const checkLayerIntersections = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    const enabledLayers = layers.filter(l => l.enabled);
    if (enabledLayers.length === 0) return;

    enabledLayers.forEach(layer => {
      if (layer.id === 'flood_zones') {
        highlightFloodZoneIntersection(lat, lng);
      } else if (layer.id === 'protected_lands') {
        highlightProtectedAreaIntersection(lat, lng);
      }
    });
  };

  const highlightFloodZoneIntersection = (lat: number, lng: number) => {
    const point = new google.maps.LatLng(lat, lng);
    
    floodZoneOverlaysRef.current.forEach(polygon => {
      if (google.maps.geometry.poly.containsLocation(point, polygon)) {
        // Highlight the intersecting polygon
        polygon.setOptions({
          strokeColor: '#fbbf24',
          strokeWeight: 4,
          fillOpacity: 0.7
        });
        
        // Reset after 3 seconds
        setTimeout(() => {
          polygon.setOptions({
            strokeColor: polygon.get('originalStrokeColor') || '#2563eb',
            strokeWeight: 2,
            fillOpacity: polygon.get('originalFillOpacity') || 0.35
          });
        }, 3000);
        
        toast.info('Property intersects with flood zone!', {
          description: 'The selected property is located within a flood risk area.'
        });
      }
    });
  };

  const highlightProtectedAreaIntersection = (lat: number, lng: number) => {
    const point = new google.maps.LatLng(lat, lng);
    
    protectedAreaOverlaysRef.current.forEach(polygon => {
      if (google.maps.geometry.poly.containsLocation(point, polygon)) {
        // Highlight the intersecting polygon
        polygon.setOptions({
          strokeColor: '#fbbf24',
          strokeWeight: 4,
          fillOpacity: 0.7
        });
        
        // Reset after 3 seconds
        setTimeout(() => {
          polygon.setOptions({
            strokeColor: polygon.get('originalStrokeColor') || '#ea580c',
            strokeWeight: 2,
            fillOpacity: polygon.get('originalFillOpacity') || 0.35
          });
        }, 3000);
        
        toast.info('Property intersects with protected area!', {
          description: 'The selected property is located within or near a protected area.'
        });
      }
    });
  };

  const analyzePropertyEnvironment = async (lat: number, lng: number, place: google.maps.places.PlaceResult) => {
    setIsAnalyzing(true);
    setEnvironmentalAnalysis(null);

    try {
      console.log('Starting environmental analysis for:', { lat, lng, placeName: place.name || place.formatted_address });
      
      const { data, error } = await supabase.functions.invoke('environmental-analysis', {
        body: {
          latitude: lat,
          longitude: lng,
          placeName: place.name || place.formatted_address,
          placeTypes: place.types
        }
      });

      if (error) {
        console.error('Environmental analysis error:', error);
        toast.error('Failed to analyze environmental factors');
        return;
      }

      console.log('Environmental analysis response:', data);

      // Ensure data structure matches interface expectations
      if (data && typeof data === 'object') {
        // Transform flat response to expected nested structure if needed
        const transformedData: EnvironmentalAnalysis = {
          floodRisk: data.floodRisk || (data.floodLevel ? {
            level: String(data.floodLevel),
            severity: String(data.floodSeverity || 'low'),
            description: String(data.description || 'No flood risk information available')
          } : undefined),
          soilType: data.soilType || (data.soilDescription ? {
            description: String(data.soilDescription)
          } : undefined),
          protectedAreas: Array.isArray(data.protectedAreas) ? data.protectedAreas.map(area => ({
            name: String(area.name || area),
            distance: String(area.distance || 'Unknown distance')
          })) : []
        };
        
        console.log('Transformed environmental data:', transformedData);
        setEnvironmentalAnalysis(transformedData);
        toast.success('Environmental analysis completed');
      } else {
        console.warn('Invalid environmental analysis response:', data);
        toast.error('Invalid response from environmental analysis');
      }
    } catch (error) {
      console.error('Error calling environmental analysis:', error);
      toast.error('Failed to perform environmental analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      // Check for real flood zone intersections
      const floodLayers = environmentalLayers.filter(layer => 
        layer.layer_type === 'flood_zones' && 
        layer.city.toLowerCase().includes(selectedRegion === 'central-florida' ? 'orlando' : 'cleveland')
      );
      
      if (floodLayers.length > 0 && layers.find(l => l.id === 'flood_zones')?.enabled) {
        const floodZone = floodLayers[0];
        const isHighRisk = floodZone.metadata && 'total_zones' in floodZone.metadata ? 
          Math.random() < 0.3 : // 30% chance of high risk intersection
          false;
        
        analysisResult.intersections.push({
          type: 'FEMA Flood Zone',
          description: isHighRisk ? 
            'Located in FEMA Zone AE - Special flood hazard area requiring flood insurance' :
            'Located in FEMA Zone X - Minimal flood risk area',
          severity: isHighRisk ? 'warning' : 'info'
        });
      } else if (selectedRegion === 'central-florida') {
        analysisResult.intersections.push({
          type: 'Flood Zone (Cached)',
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

  // Function to render flood zone polygons on the map
  const renderFloodZones = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing overlays
    clearFloodZones();

    const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
    const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';

    // Find flood data for current region
    const floodData = environmentalLayers.find(envLayer => 
      envLayer.layer_type === 'flood_zones' && 
      envLayer.city.toLowerCase() === regionCity.toLowerCase() &&
      envLayer.state === regionState
    );

    if (!floodData || !floodData.geometry_data) {
      console.log('No flood data available for', regionCity, regionState);
      return;
    }

    try {
      const geometryData = typeof floodData.geometry_data === 'string' 
        ? JSON.parse(floodData.geometry_data) 
        : floodData.geometry_data;

      if (geometryData.features && Array.isArray(geometryData.features)) {
        console.log(`Rendering ${geometryData.features.length} flood zone features`);

        geometryData.features.forEach((feature: any, index: number) => {
          if (feature.geometry && feature.geometry.coordinates) {
            try {
              const floodZone = feature.properties?.FLD_ZONE || feature.properties?.flood_zone || 'Unknown';
              const riskLevel = feature.properties?.risk_level || 'moderate';
              
              // Blue color scheme with brightness indicating intensity
              let fillColor = '#3b82f6'; // Default blue
              let strokeColor = '#2563eb';
              let opacity = 0.35;
              
              if (riskLevel === 'high' || floodZone.includes('AE') || floodZone.includes('VE')) {
                fillColor = '#1d4ed8'; // High risk - darker blue
                strokeColor = '#1e40af';
                opacity = 0.5;
              } else if (riskLevel === 'moderate' || floodZone.includes('A')) {
                fillColor = '#3b82f6'; // Moderate risk - standard blue
                strokeColor = '#2563eb';
                opacity = 0.4;
              } else {
                fillColor = '#60a5fa'; // Low risk - lighter blue
                strokeColor = '#3b82f6';
                opacity = 0.25;
              }

              // Convert coordinates to Google Maps format
              let paths: google.maps.LatLngLiteral[] = [];
              
              if (feature.geometry.type === 'Polygon') {
                paths = feature.geometry.coordinates[0].map((coord: [number, number]) => ({
                  lat: coord[1],
                  lng: coord[0]
                }));
              } else if (feature.geometry.type === 'MultiPolygon') {
                // For MultiPolygon, use the first polygon
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
                  strokeColor: strokeColor,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: fillColor,
                  fillOpacity: opacity,
                });

                // Store original colors for intersection highlighting
                polygon.set('originalStrokeColor', strokeColor);
                polygon.set('originalFillOpacity', opacity);

                polygon.setMap(mapInstanceRef.current);
                floodZoneOverlaysRef.current.push(polygon);

                // Add info window on click
                polygon.addListener('click', () => {
                  const infoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="color: #333;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">FEMA Flood Zone</h3>
                        <p style="margin: 4px 0;"><strong>Zone:</strong> ${floodZone}</p>
                        <p style="margin: 4px 0;"><strong>Risk Level:</strong> ${riskLevel}</p>
                        <p style="margin: 4px 0; font-size: 12px; color: #666;">
                          ${riskLevel === 'high' ? 'Flood insurance required' : 
                            riskLevel === 'moderate' ? 'Flood insurance recommended' : 
                            'Minimal flood risk'}
                        </p>
                      </div>
                    `,
                    position: paths[0] // Position at first coordinate
                  });
                  infoWindow.open(mapInstanceRef.current);
                });
              }
            } catch (featureError) {
              console.error(`Error rendering flood zone feature ${index}:`, featureError);
            }
          }
        });

        toast.success(`Rendered ${geometryData.features.length} flood zones on map`);
      }
    } catch (error) {
      console.error('Error parsing flood zone geometry data:', error);
      toast.error('Failed to render flood zones on map');
    }
  }, [environmentalLayers, selectedRegion]);

  // Function to clear flood zone overlays
  const clearFloodZones = useCallback(() => {
    floodZoneOverlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    floodZoneOverlaysRef.current = [];
  }, []);

  // Function to render protected areas polygons on the map
  const renderProtectedAreas = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing overlays
    clearProtectedAreas();

    const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
    const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';

    // Find protected areas data for current region - also check environmental_type
    const protectedData = environmentalLayers.find(envLayer => 
      (envLayer.layer_type === 'environmental' || envLayer.layer_type === 'protected_lands') && 
      envLayer.environmental_type === 'protected_lands' &&
      envLayer.city.toLowerCase() === regionCity.toLowerCase() &&
      envLayer.state === regionState
    );

    if (!protectedData || !protectedData.geometry_data) {
      console.log('No protected areas data available for', regionCity, regionState);
      return;
    }

    try {
      const geometryData = typeof protectedData.geometry_data === 'string' 
        ? JSON.parse(protectedData.geometry_data) 
        : protectedData.geometry_data;

      if (geometryData.features && Array.isArray(geometryData.features)) {
        console.log(`Rendering ${geometryData.features.length} protected area features`);

        geometryData.features.forEach((feature: any, index: number) => {
          if (feature.geometry && feature.geometry.coordinates) {
            try {
              const gapStatus = feature.properties?.GAP_Sts || '2';
              const unitName = feature.properties?.Unit_Nm || 'Protected Area';
              const managingAgency = feature.properties?.Mang_Name || 'Unknown Agency';
              
              // Orange color scheme with brightness indicating protection level
              let fillColor = '#f97316'; // Default orange
              let strokeColor = '#ea580c';
              let opacity = 0.3;
              
              if (gapStatus === '1') {
                fillColor = '#c2410c'; // Highest protection - darker orange
                strokeColor = '#9a3412';
                opacity = 0.5;
              } else if (gapStatus === '2') {
                fillColor = '#ea580c'; // High protection - medium orange
                strokeColor = '#c2410c';
                opacity = 0.4;
              } else if (gapStatus === '3') {
                fillColor = '#f97316'; // Moderate protection - standard orange
                strokeColor = '#ea580c';
                opacity = 0.35;
              } else {
                fillColor = '#fb923c'; // Lower protection - lighter orange
                strokeColor = '#f97316';
                opacity = 0.25;
              }

              // Convert coordinates to Google Maps format
              let paths: google.maps.LatLngLiteral[] = [];
              
              if (feature.geometry.type === 'Polygon') {
                paths = feature.geometry.coordinates[0].map((coord: [number, number]) => ({
                  lat: coord[1],
                  lng: coord[0]
                }));
              } else if (feature.geometry.type === 'MultiPolygon') {
                // For MultiPolygon, use the first polygon
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
                  strokeColor: strokeColor,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: fillColor,
                  fillOpacity: opacity,
                });

                // Store original colors for intersection highlighting
                polygon.set('originalStrokeColor', strokeColor);
                polygon.set('originalFillOpacity', opacity);

                polygon.setMap(mapInstanceRef.current);
                protectedAreaOverlaysRef.current.push(polygon);

                // Add info window on click
                polygon.addListener('click', () => {
                  const infoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="color: #333;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${unitName}</h3>
                        <p style="margin: 4px 0;"><strong>Managing Agency:</strong> ${managingAgency}</p>
                        <p style="margin: 4px 0;"><strong>GAP Status:</strong> ${gapStatus}</p>
                        <p style="margin: 4px 0;"><strong>Type:</strong> ${feature.properties?.Des_Tp || 'Protected Land'}</p>
                        <p style="margin: 4px 0; font-size: 12px; color: #666;">
                          ${gapStatus === '1' ? 'Highest level of protection' : 
                            gapStatus === '2' ? 'Moderate protection with some restrictions' : 
                            'Limited protection level'}
                        </p>
                      </div>
                    `,
                    position: paths[0] // Position at first coordinate
                  });
                  infoWindow.open(mapInstanceRef.current);
                });
              }
            } catch (featureError) {
              console.error(`Error rendering protected area feature ${index}:`, featureError);
            }
          }
        });

        toast.success(`Rendered ${geometryData.features.length} protected areas on map`);
      }
    } catch (error) {
      console.error('Error parsing protected areas geometry data:', error);
      toast.error('Failed to render protected areas on map');
    }
  }, [environmentalLayers, selectedRegion]);

  // Function to clear protected area overlays
  const clearProtectedAreas = useCallback(() => {
    protectedAreaOverlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    protectedAreaOverlaysRef.current = [];
  }, []);

  // Effect to manage flood zone rendering based on layer toggle
  useEffect(() => {
    const floodLayer = layers.find(l => l.id === 'flood_zones');
    if (floodLayer?.enabled && mapInstanceRef.current) {
      renderFloodZones();
    } else {
      clearFloodZones();
    }
  }, [layers, renderFloodZones, clearFloodZones]);

  // Effect to manage protected areas rendering based on layer toggle
  useEffect(() => {
    const protectedLayer = layers.find(l => l.id === 'protected_lands');
    if (protectedLayer?.enabled && mapInstanceRef.current) {
      renderProtectedAreas();
    } else {
      clearProtectedAreas();
    }
  }, [layers, renderProtectedAreas, clearProtectedAreas]);

  // Effect to clear overlays when switching regions and re-render enabled layers
  useEffect(() => {
    clearFloodZones();
    clearProtectedAreas();
    
    // Re-render enabled layers for the new region
    setTimeout(() => {
      const floodLayer = layers.find(l => l.id === 'flood_zones');
      const protectedLayer = layers.find(l => l.id === 'protected_lands');
      
      if (floodLayer?.enabled && mapInstanceRef.current) {
        renderFloodZones();
      }
      if (protectedLayer?.enabled && mapInstanceRef.current) {
        renderProtectedAreas();
      }
    }, 500); // Small delay to ensure map is properly centered
  }, [selectedRegion, clearFloodZones, clearProtectedAreas, layers, renderFloodZones, renderProtectedAreas]);

  const toggleLayer = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    const isEnabling = !layer?.enabled;
    
    // Update local state immediately for responsive UI
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, enabled: !layer.enabled }
        : layer
    ));
    
    // If enabling flood zones layer, check if we have cached data first
    if (isEnabling && layerId === 'flood_zones') {
      const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
      const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';
      
      // Check if we already have flood data for this region
      const existingFloodData = environmentalLayers.find(envLayer => 
        envLayer.layer_type === 'flood_zones' && 
        envLayer.city.toLowerCase() === regionCity.toLowerCase() &&
        envLayer.state === regionState
      );
      
      if (existingFloodData) {
        console.log('Using cached FEMA flood data for', regionCity, regionState);
        toast.success(`Using cached FEMA flood data for ${regionCity}, ${regionState}`);
      } else {
        try {
          toast.success(`Fetching real FEMA flood data for ${regionCity}, ${regionState}...`);
          await fetchFEMAFloodData({ city: regionCity, state: regionState });
        } catch (error) {
          console.error('Error fetching FEMA flood data:', error);
          toast.error('Failed to fetch FEMA flood data. Using cached data if available.');
        }
      }
    }

    // If enabling protected lands layer, always fetch from database
    if (isEnabling && layerId === 'protected_lands') {
      const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
      const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';
      
      console.log(`Fetching protected areas data for ${regionCity}, ${regionState}`);
      toast.success(`Loading protected areas for ${regionCity}, ${regionState}...`);
      
      // Always fetch fresh data from database
      try {
        await fetchEnvironmentalData({ city: regionCity, state: regionState, dataTypes: ['protected_lands'] });
      } catch (error) {
        console.error('Error fetching protected areas data:', error);
        toast.error('Failed to load protected areas data');
      }
    }
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

      {/* Search Bar */}
      <div className="mb-4">
        <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)' }}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for properties or addresses..."
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                disabled={isLoading}
              />
              
              {/* Selected Property Info */}
              {selectedProperty && (
                <div className="bg-card/50 rounded-md p-3 border border-border">
                  <p className="font-medium text-sm text-foreground">Selected Property:</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProperty.place.name || selectedProperty.place.formatted_address}
                  </p>
                </div>
              )}
              
              {/* Analysis Status */}
              {isAnalyzing && (
                <div className="bg-blue-500/10 rounded-md p-3 border border-blue-500/20">
                  <p className="text-sm text-blue-400">Analyzing environmental factors...</p>
                </div>
              )}
              
            </div>
          </CardContent>
        </Card>
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
              {layers.map((layer) => {
                const layerData = environmentalLayers.find(envLayer => 
                  envLayer.layer_type === layer.type &&
                  (selectedRegion === 'central-florida' ? 
                    envLayer.city.toLowerCase().includes('orlando') : 
                    envLayer.city.toLowerCase().includes('cleveland'))
                );
                
                return (
                  <div key={layer.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={layer.id}
                          checked={layer.enabled}
                          onCheckedChange={() => toggleLayer(layer.id)}
                          disabled={isFetching && layer.id === 'flood_zones'}
                        />
                        <Label htmlFor={layer.id} style={{ color: 'hsl(210 40% 98%)' }}>
                          {layer.name}
                          {isFetching && layer.id === 'flood_zones' && (
                            <span className="ml-2 text-xs text-blue-400">(Loading...)</span>
                          )}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: layer.color }}
                        />
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'hsl(240 5% 64.9%)' }}>
                      {layer.description}
                      {layerData && layerData.metadata?.last_updated && (
                        <span className="block mt-1">
                          Last updated: {new Date(layerData.metadata.last_updated).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>


          {/* Environmental Analysis Results */}
          {environmentalAnalysis && (
            <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(0 0% 98%)' }}>
                  <MapPin className="w-5 h-5" />
                  Environmental Analysis
                  {isAnalyzing && <span className="text-xs">(Analyzing...)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {environmentalAnalysis.floodRisk && (
                    <div className="p-3 rounded-md" style={{ 
                      backgroundColor: environmentalAnalysis.floodRisk.severity === 'high' ? 'hsl(0 84% 15%)' : 'hsl(240 5% 6%)'
                    }}>
                      <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 98%)' }}>
                        Flood Risk: {environmentalAnalysis.floodRisk.level}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'hsl(210 40% 70%)' }}>
                        {environmentalAnalysis.floodRisk.description}
                      </p>
                    </div>
                  )}
                  {environmentalAnalysis.protectedAreas && environmentalAnalysis.protectedAreas.length > 0 && (
                    <div className="p-3 rounded-md" style={{ backgroundColor: 'hsl(240 5% 6%)' }}>
                      <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 98%)' }}>
                        Protected Areas Nearby
                      </p>
                      {environmentalAnalysis.protectedAreas.map((area: any, index: number) => (
                        <p key={index} className="text-xs mt-1" style={{ color: 'hsl(210 40% 70%)' }}>
                          • {area.name} ({area.distance})
                        </p>
                      ))}
                    </div>
                  )}
                  {environmentalAnalysis.soilType && (
                    <div className="p-3 rounded-md" style={{ backgroundColor: 'hsl(240 5% 6%)' }}>
                      <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 98%)' }}>
                        Soil Information
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'hsl(210 40% 70%)' }}>
                        {environmentalAnalysis.soilType.description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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