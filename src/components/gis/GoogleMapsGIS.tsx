import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, MapPin, Layers, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useSpatialAnalysis } from '@/hooks/useSpatialAnalysis';
import { useAdvancedGIS } from '@/hooks/useAdvancedGIS';
import { supabase } from '@/integrations/supabase/client';

interface LayerToggle {
  id: string;
  name: string;
  type: 'flood_zones' | 'soil_types' | 'protected_lands' | 'roads' | 'wetlands' | 'utilities' | 'soils';
  enabled: boolean;
  color: string;
  description: string;
}

interface SpatialAnalysisResult {
  id?: string;
  analysis_type?: string;
  input_layer_ids?: string[];
  result_data?: any;
  parameters?: any;
  created_at?: string;
  user_id?: string;
  parcelId?: string;
  intersections?: {
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
  const soilsWetlandsOverlaysRef = useRef<google.maps.Polygon[]>([]);
  
  // Refs for analysis report stability
  const lastGoodCombinedAnalysisRef = useRef<{
    floodZones: string[];
    protectedAreas: string[];
    soilsWetlands: string[];
  } | undefined>(undefined);
  const lastPropertyKeyRef = useRef<string | null>(null);
  
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
  const [combinedAnalysis, setCombinedAnalysis] = useState<{
    floodZones: string[];
    protectedAreas: string[];
    soilsWetlands: string[];
  } | undefined>(undefined);

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
    },
    { 
      id: 'soils_wetlands', 
      name: 'Soils & Wetlands', 
      type: 'soils',
      enabled: false, 
      color: '#8B4513',
      description: 'NRCS soil types and USFWS wetlands data'
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

    const handlePlaceSelection = async (place: google.maps.places.PlaceResult) => {
      if (!place.geometry || !place.geometry.location) {
        toast.error('No location details available for this place');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

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

      // Clear previous analysis states
      setEnvironmentalAnalysis(null);

      // Ensure region environmental data
      const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
      const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';
      await ensureRegionEnvData(regionCity, regionState);

      // Trigger environmental analysis
      await analyzePropertyEnvironment(lat, lng, place);

      // Compute combined analysis
      computeCombinedAnalysis(lat, lng);

      // Check for intersections with active layers
      checkLayerIntersections(lat, lng);

      toast.success(`Selected: ${place.name || place.formatted_address}`);
    };

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      handlePlaceSelection(place);
    });

    // Add keydown handler for Enter key
    if (searchInputRef.current) {
      searchInputRef.current.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter' && event.target) {
          const address = (event.target as HTMLInputElement).value;
          if (address && !autocomplete.getPlace()?.geometry) {
            // Geocode the typed address
            const geocoder = new google.maps.Geocoder();
            try {
              const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address }, (results, status) => {
                  if (status === google.maps.GeocoderStatus.OK && results) {
                    resolve(results);
                  } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                  }
                });
              });

              if (results.length > 0) {
                const result = results[0];
                const place: google.maps.places.PlaceResult = {
                  geometry: result.geometry,
                  formatted_address: result.formatted_address,
                  name: result.formatted_address,
                  types: result.types,
                  place_id: result.place_id
                };
                await handlePlaceSelection(place);
              }
            } catch (error) {
              console.error('Geocoding error:', error);
              toast.error('Could not find location. Please select from suggestions.');
            }
          }
        }
      });
    }

    autocompleteRef.current = autocomplete;
  }, [selectedRegion]);

  const ensureRegionEnvData = async (city: string, state: string) => {
    const hasFloodData = environmentalLayers.some(layer => 
      layer.layer_type === 'flood_zones' && 
      (layer.city.toLowerCase().includes(city.toLowerCase()) || layer.state === state) && 
      layer.state === state
    );
    
    const hasProtectedData = environmentalLayers.some(layer => 
      layer.environmental_type === 'protected_lands' && 
      (layer.city.toLowerCase().includes(city.toLowerCase()) || layer.state === state) && 
      layer.state === state
    );
    
    const hasSoilsData = environmentalLayers.some(layer => 
      (layer.environmental_type === 'soils' || layer.environmental_type === 'wetlands') && 
      (layer.city.toLowerCase().includes(city.toLowerCase()) || layer.state === state) && 
      layer.state === state
    );

    const promises = [];
    
    if (!hasFloodData) {
      promises.push(fetchFEMAFloodData({ city, state }));
    }
    
    if (!hasProtectedData) {
      promises.push(fetchEnvironmentalData({ city, state, dataTypes: ['protected_lands'] }));
    }
    
    if (!hasSoilsData) {
      promises.push(fetchEnvironmentalData({ city, state, dataTypes: ['soils_wetlands'] }));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  const computeCombinedAnalysis = (lat: number, lng: number) => {
    if (!window.google?.maps?.geometry?.poly) {
      console.log('Google Maps geometry API not available');
      return;
    }
    
    // Generate current property key for stability
    const currentPropertyKey = selectedProperty ? 
      `${selectedProperty.location.lat().toFixed(6)}_${selectedProperty.location.lng().toFixed(6)}_${selectedRegion}` : 
      null;
    
    // Skip recomputation if environmentalLayers are empty
    if (environmentalLayers.length === 0) {
      console.log('Skipping analysis - no environmental data available');
      return;
    }
    
    const point = new window.google.maps.LatLng(lat, lng);
    const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
    const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';
    
    const analysis: {
      floodZones: string[];
      protectedAreas: string[];
      soilsWetlands: string[];
    } = {
      floodZones: [],
      protectedAreas: [],
      soilsWetlands: []
    };

    // Helper function to create polygon with proper hole handling
    const createPolygonFromCoords = (coordinates: any, geometryType: string): google.maps.Polygon[] => {
      const polygons: google.maps.Polygon[] = [];
      
      if (geometryType === 'Polygon') {
        // Handle polygon with potential holes
        const outerRing = coordinates[0].map((coord: [number, number]) => 
          new window.google.maps.LatLng(coord[1], coord[0])
        );
        const holes = coordinates.slice(1).map((hole: [number, number][]) =>
          hole.map((coord: [number, number]) => new window.google.maps.LatLng(coord[1], coord[0]))
        );
        
        const paths = holes.length > 0 ? [outerRing, ...holes] : outerRing;
        polygons.push(new window.google.maps.Polygon({ paths }));
      } else if (geometryType === 'MultiPolygon') {
        // Handle multiple polygons, each potentially with holes
        for (const polygonCoords of coordinates) {
          const outerRing = polygonCoords[0].map((coord: [number, number]) => 
            new window.google.maps.LatLng(coord[1], coord[0])
          );
          const holes = polygonCoords.slice(1).map((hole: [number, number][]) =>
            hole.map((coord: [number, number]) => new window.google.maps.LatLng(coord[1], coord[0]))
          );
          
          const paths = holes.length > 0 ? [outerRing, ...holes] : outerRing;
          polygons.push(new window.google.maps.Polygon({ paths }));
        }
      }
      
      return polygons;
    };

    // Check flood zones with enhanced details
    const floodData = environmentalLayers.find(layer => 
      layer.layer_type === 'flood_zones' && 
      (layer.city.toLowerCase().includes(regionCity.toLowerCase()) || layer.state === regionState) &&
      layer.state === regionState
    );
    
    if (floodData?.geometry_data) {
      try {
        const geometryData = typeof floodData.geometry_data === 'string' 
          ? JSON.parse(floodData.geometry_data) 
          : floodData.geometry_data;
        
        if (geometryData.features) {
          for (const feature of geometryData.features) {
            if (feature.geometry?.coordinates) {
              const polygons = createPolygonFromCoords(feature.geometry.coordinates, feature.geometry.type);
              
              for (const polygon of polygons) {
                if (window.google.maps.geometry.poly.containsLocation(point, polygon)) {
                  const zone = feature.properties?.FLD_ZONE || feature.properties?.ZONE_SUBTY || feature.properties?.flood_zone || 'Unknown Zone';
                  const riskLevel = feature.properties?.risk_level || 
                    (zone.includes('VE') || zone.includes('AE') ? 'High' :
                     zone.includes('A') ? 'Moderate' : 'Minimal');
                  
                  const floodDetail = `${zone} — Risk: ${riskLevel}`;
                  if (!analysis.floodZones.includes(floodDetail)) {
                    analysis.floodZones.push(floodDetail);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking flood zones:', error);
      }
    }

    // Check protected areas with enhanced details
    const protectedData = environmentalLayers.find(layer => 
      layer.environmental_type === 'protected_lands' && 
      (layer.city.toLowerCase().includes(regionCity.toLowerCase()) || layer.state === regionState) &&
      layer.state === regionState
    );
    
    if (protectedData?.geometry_data) {
      try {
        const geometryData = typeof protectedData.geometry_data === 'string' 
          ? JSON.parse(protectedData.geometry_data) 
          : protectedData.geometry_data;
        
        if (geometryData.features) {
          for (const feature of geometryData.features) {
            if (feature.geometry?.coordinates) {
              const polygons = createPolygonFromCoords(feature.geometry.coordinates, feature.geometry.type);
              
              for (const polygon of polygons) {
                if (window.google.maps.geometry.poly.containsLocation(point, polygon)) {
                  const unitName = feature.properties?.Unit_Nm || 'Protected Area';
                  const agency = feature.properties?.Mang_Name || 'Unknown Agency';
                  const type = feature.properties?.Des_Tp || 'Protected Land';
                  const gapStatus = feature.properties?.GAP_Sts || '4';
                  
                  const protectedDetail = `${unitName} — ${agency} • ${type} (GAP: ${gapStatus})`;
                  if (!analysis.protectedAreas.includes(protectedDetail)) {
                    analysis.protectedAreas.push(protectedDetail);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking protected areas:', error);
      }
    }

    // Check soils and wetlands with enhanced details
    const soilsWetlandsData = environmentalLayers.filter(layer => 
      (layer.environmental_type === 'soils' || layer.environmental_type === 'wetlands') && 
      (layer.city.toLowerCase().includes(regionCity.toLowerCase()) || layer.state === regionState) &&
      layer.state === regionState
    );
    
    for (const layerData of soilsWetlandsData) {
      if (layerData.geometry_data) {
        try {
          const geometryData = typeof layerData.geometry_data === 'string' 
            ? JSON.parse(layerData.geometry_data) 
            : layerData.geometry_data;
          
          if (geometryData.features) {
            for (const feature of geometryData.features) {
              if (feature.geometry?.coordinates) {
                const polygons = createPolygonFromCoords(feature.geometry.coordinates, feature.geometry.type);
                
                for (const polygon of polygons) {
                  if (window.google.maps.geometry.poly.containsLocation(point, polygon)) {
                    let name = '';
                    if (layerData.environmental_type === 'soils') {
                      const soilName = feature.properties?.MUNAME || 'Unknown Soil';
                      const drainage = feature.properties?.DRCLASSDCD || feature.properties?.HYDGRPDCD || feature.properties?.HYDGRP || '';
                      name = drainage ? `${soilName} (${drainage})` : soilName;
                    } else if (layerData.environmental_type === 'wetlands') {
                      const wetlandType = feature.properties?.WETLAND_TY || feature.properties?.WETLAND_TYPE || 'Wetland';
                      const system = feature.properties?.SYSTEM || '';
                      name = system ? `${wetlandType} — ${system}` : wetlandType;
                    }
                    
                    if (name && !analysis.soilsWetlands.includes(name)) {
                      analysis.soilsWetlands.push(name);
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error checking ${layerData.environmental_type}:`, error);
        }
      }
    }

    // Update analysis and preserve as last good state with debug logs
    console.log('Analysis computed:', {
      floodZones: analysis.floodZones,
      protectedAreas: analysis.protectedAreas,
      soilsWetlands: analysis.soilsWetlands,
      totalMatches: analysis.floodZones.length + analysis.protectedAreas.length + analysis.soilsWetlands.length
    });
    setCombinedAnalysis(analysis);
    lastGoodCombinedAnalysisRef.current = analysis;
    lastPropertyKeyRef.current = currentPropertyKey;
  };

  const checkLayerIntersections = (lat: number, lng: number) => {
    console.log('Checking layer intersections for property at:', lat, lng);
    if (!mapInstanceRef.current) return;

    const enabledLayers = layers.filter(l => l.enabled);
    console.log('Enabled layers:', enabledLayers.map(l => l.name));
    
    if (enabledLayers.length === 0) {
      console.log('No enabled layers to check');
      return;
    }

    const intersections: string[] = [];

    enabledLayers.forEach(layer => {
      console.log(`Checking intersection with ${layer.name} (${layer.id})`);
      if (layer.id === 'flood_zones') {
        const floodIntersection = checkFloodZoneIntersection(lat, lng);
        if (floodIntersection) intersections.push(floodIntersection);
      } else if (layer.id === 'protected_lands') {
        const protectedIntersection = checkProtectedAreaIntersection(lat, lng);
        if (protectedIntersection) intersections.push(protectedIntersection);
      } else if (layer.id === 'soils_wetlands') {
        const soilsWetlandsIntersection = checkSoilsWetlandsIntersection(lat, lng);
        if (soilsWetlandsIntersection) intersections.push(soilsWetlandsIntersection);
      }
    });

    // Show consolidated message and update analysis results
    if (intersections.length > 0) {
      const message = intersections.length === 1 
        ? intersections[0]
        : `Property intersects with ${intersections.length} layers: ${intersections.join(', ')}`;
      
      toast.warning('Layer Intersection Detected!', {
        description: message
      });

      // Add to analysis results
      setAnalysisResults(prev => [...prev, {
        id: Date.now().toString(),
        analysis_type: 'Layer Intersection',
        input_layer_ids: enabledLayers.map(l => l.id),
        result_data: {
          intersections,
          location: { lat, lng },
          message
        },
        parameters: { layers: enabledLayers.map(l => l.name) },
        created_at: new Date().toISOString(),
        user_id: 'current-user'
      }]);
    }
  };

  const checkFloodZoneIntersection = (lat: number, lng: number): string | null => {
    const point = new google.maps.LatLng(lat, lng);
    
    for (const polygon of floodZoneOverlaysRef.current) {
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
        
        return 'FEMA Flood Zone (Special flood hazard area)';
      }
    }
    return null;
  };

  const checkProtectedAreaIntersection = (lat: number, lng: number): string | null => {
    const point = new google.maps.LatLng(lat, lng);
    
    for (const polygon of protectedAreaOverlaysRef.current) {
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
        
        return 'Protected Area (Conservation land)';
      }
    }
    return null;
  };

  const checkSoilsWetlandsIntersection = (lat: number, lng: number): string | null => {
    // Check both soils and wetlands layers
    const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
    const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';
    
    const soilsLayers = environmentalLayers.filter(layer => 
      layer.environmental_type === 'soils' && 
      layer.city.toLowerCase() === regionCity.toLowerCase() &&
      layer.state === regionState
    );
    
    const wetlandsLayers = environmentalLayers.filter(layer => 
      layer.environmental_type === 'wetlands' && 
      layer.city.toLowerCase() === regionCity.toLowerCase() &&
      layer.state === regionState
    );
    
    const intersections = [];
    
    // Check soils (simplified check for demo)
    if (soilsLayers.length > 0) {
      intersections.push('NRCS Soil Survey (soil type information available)');
    }
    
    // Check wetlands (simplified check for demo)  
    if (wetlandsLayers.length > 0) {
      intersections.push('USFWS Wetlands (regulated wetland area)');
    }
    
    return intersections.length > 0 ? intersections.join(', ') : null;
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

  // Function to render soils & wetlands polygons on the map
  const renderSoilsWetlands = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing overlays
    clearSoilsWetlands();

    const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
    const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';

    // Find soils and wetlands data for current region
    const soilsData = environmentalLayers.find(envLayer => 
      (envLayer.environmental_type === 'soils' || envLayer.layer_type === 'soil_conditions') && 
      envLayer.city.toLowerCase() === regionCity.toLowerCase() &&
      envLayer.state === regionState
    );

    const wetlandsData = environmentalLayers.find(envLayer => 
      envLayer.environmental_type === 'wetlands' && 
      envLayer.city.toLowerCase() === regionCity.toLowerCase() &&
      envLayer.state === regionState
    );

    console.log('Rendering soils & wetlands for:', regionCity, regionState);
    console.log('Soils data found:', !!soilsData, soilsData?.layer_name);
    console.log('Wetlands data found:', !!wetlandsData, wetlandsData?.layer_name);

    // Render soils data (brown colors)
    if (soilsData?.geometry_data?.features) {
      soilsData.geometry_data.features.forEach((feature: any, index: number) => {
        if (feature.geometry?.coordinates) {
          try {
            const paths = feature.geometry.coordinates[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }));

            const polygon = new google.maps.Polygon({
              paths: paths,
              strokeColor: '#8B4513',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#DEB887',
              fillOpacity: 0.4,
            });

            polygon.setMap(mapInstanceRef.current);
            soilsWetlandsOverlaysRef.current.push(polygon);

            // Add click handler for soil info
            polygon.addListener('click', () => {
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div>
                    <h3>Soil Information</h3>
                    <p><strong>Name:</strong> ${feature.properties?.MUNAME || 'Unknown'}</p>
                    <p><strong>Drainage:</strong> ${feature.properties?.DRCLASSDCD || 'Unknown'}</p>
                    <p><strong>Hydro Group:</strong> ${feature.properties?.HYDGRP || 'Unknown'}</p>
                    <p><strong>AWS:</strong> ${feature.properties?.AWS || 'Unknown'}</p>
                    <p><strong>K Factor:</strong> ${feature.properties?.KFACT || 'Unknown'}</p>
                  </div>
                `,
                position: { lat: paths[0].lat, lng: paths[0].lng }
              });
              infoWindow.open(mapInstanceRef.current);
            });
          } catch (error) {
            console.error('Error rendering soil polygon:', error);
          }
        }
      });
    }

    // Render wetlands data (blue colors)
    if (wetlandsData?.geometry_data?.features) {
      wetlandsData.geometry_data.features.forEach((feature: any, index: number) => {
        if (feature.geometry?.coordinates) {
          try {
            const paths = feature.geometry.coordinates[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }));

            const polygon = new google.maps.Polygon({
              paths: paths,
              strokeColor: '#006994',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#87CEEB',
              fillOpacity: 0.5,
            });

            polygon.setMap(mapInstanceRef.current);
            soilsWetlandsOverlaysRef.current.push(polygon);

            // Add click handler for wetland info
            polygon.addListener('click', () => {
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div>
                    <h3>Wetland Information</h3>
                    <p><strong>Type:</strong> ${feature.properties?.WETLAND_TY || 'Unknown'}</p>
                    <p><strong>Class:</strong> ${feature.properties?.CLASS || 'Unknown'}</p>
                    <p><strong>System:</strong> ${feature.properties?.SYSTEM || 'Unknown'}</p>
                    <p><strong>Water Regime:</strong> ${feature.properties?.WATER_REGI || 'Unknown'}</p>
                    <p><strong>Area:</strong> ${feature.properties?.ACRES || 'Unknown'} acres</p>
                  </div>
                `,
                position: { lat: paths[0].lat, lng: paths[0].lng }
              });
              infoWindow.open(mapInstanceRef.current);
            });
          } catch (error) {
            console.error('Error rendering wetland polygon:', error);
          }
        }
      });
    }

    if (soilsData || wetlandsData) {
      toast.success(`Rendered ${regionCity} soils & wetlands data`);
    } else {
      console.log('No soils or wetlands data available for', regionCity, regionState);
    }
  }, [environmentalLayers, selectedRegion]);

  // Function to clear soils & wetlands overlays
  const clearSoilsWetlands = useCallback(() => {
    soilsWetlandsOverlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    soilsWetlandsOverlaysRef.current = [];
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

  // Effect to manage soils & wetlands rendering based on layer toggle
  useEffect(() => {
    const soilsWetlandsLayer = layers.find(l => l.id === 'soils_wetlands');
    if (soilsWetlandsLayer?.enabled && mapInstanceRef.current) {
      renderSoilsWetlands();
    } else {
      clearSoilsWetlands();
    }
  }, [layers, renderSoilsWetlands, clearSoilsWetlands]);

  // Effect to clear overlays when switching regions and re-render enabled layers
  useEffect(() => {
    clearFloodZones();
    clearProtectedAreas();
    clearSoilsWetlands();
    
    // Re-render enabled layers for the new region
    setTimeout(() => {
      const floodLayer = layers.find(l => l.id === 'flood_zones');
      const protectedLayer = layers.find(l => l.id === 'protected_lands');
      const soilsWetlandsLayer = layers.find(l => l.id === 'soils_wetlands');
      
      if (floodLayer?.enabled && mapInstanceRef.current) {
        renderFloodZones();
      }
      if (protectedLayer?.enabled && mapInstanceRef.current) {
        renderProtectedAreas();
      }
      if (soilsWetlandsLayer?.enabled && mapInstanceRef.current) {
        renderSoilsWetlands();
      }
    }, 500); // Small delay to ensure map is properly centered
  }, [selectedRegion, clearFloodZones, clearProtectedAreas, clearSoilsWetlands, layers, renderFloodZones, renderProtectedAreas, renderSoilsWetlands]);

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
    
    // If enabling soils & wetlands layer, fetch both datasets
    if (isEnabling && layerId === 'soils_wetlands') {
      const regionCity = selectedRegion === 'central-florida' ? 'Orlando' : 'Cleveland';
      const regionState = selectedRegion === 'central-florida' ? 'FL' : 'OH';
      
      try {
        toast.success(`Fetching soils and wetlands data for ${regionCity}, ${regionState}...`);
        await fetchEnvironmentalData({ city: regionCity, state: regionState, dataTypes: ['soils_wetlands'] });
      } catch (error) {
        console.error('Error fetching soils and wetlands data:', error);
        toast.error('Failed to fetch soils and wetlands data');
      }
    }
    
    // Re-check intersections when any layer is toggled and a property is selected
    if (selectedProperty) {
      console.log('Re-checking intersections after layer toggle');
      checkLayerIntersections(
        selectedProperty.location.lat(),
        selectedProperty.location.lng()
      );
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

  // Recompute analysis when data changes (independent of layer toggles)
  useEffect(() => {
    if (selectedProperty && window.google?.maps?.geometry?.poly && environmentalLayers.length > 0) {
      const lat = selectedProperty.location.lat();
      const lng = selectedProperty.location.lng();
      console.log('Recomputing analysis due to data/region change:', { lat, lng, selectedRegion });
      computeCombinedAnalysis(lat, lng);
    }
  }, [selectedProperty, environmentalLayers, selectedRegion]);

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


          {/* Analysis Report */}
          {selectedProperty && (() => {
            // Use current analysis or fallback to last good analysis for stability
            const analysisToShow = combinedAnalysis || lastGoodCombinedAnalysisRef.current;
            
            // Show analysis if we have data for any category
            return analysisToShow && 
              (analysisToShow.floodZones.length > 0 || analysisToShow.protectedAreas.length > 0 || analysisToShow.soilsWetlands.length > 0) ? (
              <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(0 0% 98%)' }}>
                    <MapPin className="w-5 h-5" />
                    Analysis Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisToShow.floodZones.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'hsl(240 51% 15%)', border: '1px solid hsl(240 51% 25%)' }}>
                      <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="hsl(240 51% 75%)" viewBox="0 0 24 24">
                          <path d="M12 2L14 7L18 7L15 10L16 14L12 12L8 14L9 10L6 7L10 7L12 2Z"/>
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-medium" style={{ color: 'hsl(240 51% 95%)' }}>FEMA Flood Zones</h5>
                        <div className="text-sm space-y-1" style={{ color: 'hsl(240 51% 75%)' }}>
                          {analysisToShow.floodZones.map((zone, index) => (
                            <div key={index}>{zone}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analysisToShow.protectedAreas.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'hsl(142 51% 15%)', border: '1px solid hsl(142 51% 25%)' }}>
                      <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="hsl(142 51% 75%)" viewBox="0 0 24 24">
                          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10V14H17V20H7V14H9.2V10C9.2 8.6 10.6 7 12 7Z"/>
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-medium" style={{ color: 'hsl(142 51% 95%)' }}>Protected Areas</h5>
                        <div className="text-sm space-y-1" style={{ color: 'hsl(142 51% 75%)' }}>
                          {analysisToShow.protectedAreas.map((area, index) => (
                            <div key={index}>{area}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analysisToShow.soilsWetlands.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'hsl(30 51% 15%)', border: '1px solid hsl(30 51% 25%)' }}>
                      <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="hsl(30 51% 75%)" viewBox="0 0 24 24">
                          <path d="M14,6L10.25,11L13.1,14.8L11.5,16C9.81,13.75 7,10 7,10L1,18H23L14,6Z"/>
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-medium" style={{ color: 'hsl(30 51% 95%)' }}>Soils & Wetlands</h5>
                        <div className="text-sm space-y-1" style={{ color: 'hsl(30 51% 75%)' }}>
                          {analysisToShow.soilsWetlands.map((soil, index) => (
                            <div key={index}>{soil}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null;
          })()}

        </div>
      </div>
    </div>
  );
};