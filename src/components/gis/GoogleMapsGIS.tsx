// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useSpatialAnalysis } from '@/hooks/useSpatialAnalysis';
import { useAdvancedGIS } from '@/hooks/useAdvancedGIS';
import { supabase } from '@/integrations/supabase/client';
import { GISSidebar } from '@/components/gis/GISSidebar';
import {
  buildAnalysisSummary,
  constructionImplications,
  cowardinPlainEnglish,
  floodZoneExplanation
} from '@/components/gis/utils/analysisSummary';

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

interface CurrentLocation {
  city: string;
  state: string;
  lat: number;
  lng: number;
  displayName: string;
}

const US_CENTER = { lat: 39.5, lng: -98.35 };

/** Escape untrusted text before interpolating into InfoWindow HTML */
const escapeHtml = (str: unknown): string => {
  const s = String(str ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const extractLocationFromPlace = (place: google.maps.places.PlaceResult): {
  city: string;
  state: string;
  lat: number;
  lng: number;
} | null => {
  if (!place.geometry?.location) return null;

  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();

  let city = '';
  let state = '';

  for (const component of place.address_components || []) {
    const types = component.types || [];
    if (!city && (types.includes('locality') || types.includes('postal_town'))) {
      city = component.long_name;
    } else if (!city && types.includes('sublocality')) {
      city = component.long_name;
    } else if (!city && types.includes('administrative_area_level_2')) {
      city = component.long_name;
    }
    if (!state && types.includes('administrative_area_level_1')) {
      state = component.short_name;
    }
  }

  if (!city) {
    city = place.name || 'Unknown';
  }
  if (!state) {
    state = '';
  }

  return { city, state, lat, lng };
};

export const GoogleMapsGIS: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const selectedPropertyMarkerRef = useRef<google.maps.Marker | null>(null);
  const floodZoneOverlaysRef = useRef<google.maps.Polygon[]>([]);
  const protectedAreaOverlaysRef = useRef<google.maps.Polygon[]>([]);
  const soilsWetlandsOverlaysRef = useRef<google.maps.Polygon[]>([]);
  // Single InfoWindow instance — only one open at a time
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const openInfoWindow = useCallback((content: string, position: google.maps.LatLngLiteral | google.maps.LatLng) => {
    if (!window.google?.maps) return;
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
    }
    const iw = new window.google.maps.InfoWindow({ content, position });
    iw.open(mapInstanceRef.current);
    activeInfoWindowRef.current = iw;
  }, []);

  const lastGoodCombinedAnalysisRef = useRef<{
    floodZones: string[];
    protectedAreas: string[];
    soilsWetlands: string[];
  } | undefined>(undefined);
  const lastPropertyKeyRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
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

  const [currentLocation, setCurrentLocation] = useState<CurrentLocation>({
    city: '',
    state: '',
    lat: 0,
    lng: 0,
    displayName: ''
  });
  const [disasterHistory, setDisasterHistory] = useState<any[]>([]);
  const [disasterHistoryLoading, setDisasterHistoryLoading] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);
  const [showRiskOverlay, setShowRiskOverlay] = useState(true);

  const { runIntersectionAnalysis } = useSpatialAnalysis();
  const { fetchEnvironmentalData, fetchFEMAFloodData, fetchDisasterHistory, environmentalLayers, isFetching } = useAdvancedGIS();

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
      color: '#a855f7',
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

      const map = new google.maps.Map(mapRef.current, {
        center: US_CENTER,
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        styles: [
          { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#2d3748' }] }
        ]
      });

      mapInstanceRef.current = map;

      initializePlacesAutocomplete(google);

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
  }, []);

  const initializePlacesAutocomplete = useCallback((google: any) => {
    if (!searchInputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
      types: ['geocode'],
      fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types', 'address_components'],
      componentRestrictions: { country: 'us' }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      handlePlaceSelection(place);
    });

    if (searchInputRef.current) {
      searchInputRef.current.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter' && event.target) {
          const address = (event.target as HTMLInputElement).value;
          if (address && !autocomplete.getPlace()?.geometry) {
            const geocoder = new google.maps.Geocoder();
            try {
              const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address, componentRestrictions: { country: 'US' } }, (results, status) => {
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
                  place_id: result.place_id,
                  address_components: result.address_components
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
  }, []);

  const handlePlaceSelection = async (place: google.maps.places.PlaceResult) => {
    if (!place.geometry || !place.geometry.location) {
      toast.error('No location details available for this place');
      return;
    }

    const extracted = extractLocationFromPlace(place);
    if (!extracted) {
      toast.error('Could not determine city/state for this place');
      return;
    }

    const displayName = place.formatted_address || place.name || `${extracted.city}, ${extracted.state}`;

    setSelectedProperty({
      place,
      location: place.geometry.location
    });

    setCurrentLocation({
      city: extracted.city,
      state: extracted.state,
      lat: extracted.lat,
      lng: extracted.lng,
      displayName
    });

    mapInstanceRef.current?.setCenter(place.geometry.location);
    mapInstanceRef.current?.setZoom(13);

    if (selectedPropertyMarkerRef.current) {
      selectedPropertyMarkerRef.current.setMap(null);
    }

    const google = (window as any).google;
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

    setEnvironmentalAnalysis(null);
    setShowRiskOverlay(true);

    // Auto-enable all three layers on every new search
    setLayers((prev) => prev.map((l) => ({ ...l, enabled: true })));

    // Kick off disaster history in parallel (non-blocking, non-critical)
    setDisasterHistoryLoading(true);
    setDisasterHistory([]);
    fetchDisasterHistory({
      state: extracted.state,
      latitude: extracted.lat,
      longitude: extracted.lng
    })
      .then((res: any) => {
        const list = Array.isArray(res?.disasters) ? res.disasters : [];
        setDisasterHistory(list);
      })
      .catch((err) => {
        console.error('Disaster history fetch failed:', err);
        setDisasterHistory([]);
      })
      .finally(() => setDisasterHistoryLoading(false));

    // Trigger all three layer fetches in parallel with the actual searched coordinates
    const fetchPromise = Promise.all([
      fetchFEMAFloodData({
        city: extracted.city,
        state: extracted.state,
        latitude: extracted.lat,
        longitude: extracted.lng
      }).catch((err) => {
        console.error('FEMA fetch failed:', err);
        return null;
      }),
      fetchEnvironmentalData({
        city: extracted.city,
        state: extracted.state,
        dataTypes: ['protected_lands'],
        latitude: extracted.lat,
        longitude: extracted.lng
      }).catch((err) => {
        console.error('Protected lands fetch failed:', err);
        return null;
      }),
      fetchEnvironmentalData({
        city: extracted.city,
        state: extracted.state,
        dataTypes: ['soils_wetlands'],
        latitude: extracted.lat,
        longitude: extracted.lng
      }).catch((err) => {
        console.error('Soils/wetlands fetch failed:', err);
        return null;
      })
    ]);

    await analyzePropertyEnvironment(extracted.lat, extracted.lng, place);

    await fetchPromise;

    computeCombinedAnalysis(extracted.lat, extracted.lng);
    checkLayerIntersections(extracted.lat, extracted.lng);
    setLastAnalyzedAt(new Date().toISOString());

    toast.success(`Loaded GIS layers for ${extracted.city}, ${extracted.state}`);
  };

  const computeCombinedAnalysis = (lat: number, lng: number) => {
    if (!window.google?.maps?.geometry?.poly) {
      console.log('Google Maps geometry API not available');
      return;
    }

    const currentPropertyKey = selectedProperty
      ? `${selectedProperty.location.lat().toFixed(6)}_${selectedProperty.location.lng().toFixed(6)}_${currentLocation.city}_${currentLocation.state}`
      : null;

    if (environmentalLayers.length === 0) {
      console.log('Skipping analysis - no environmental data available');
      return;
    }

    const point = new window.google.maps.LatLng(lat, lng);

    const analysis: {
      floodZones: string[];
      protectedAreas: string[];
      soilsWetlands: string[];
    } = {
      floodZones: [],
      protectedAreas: [],
      soilsWetlands: []
    };

    const createPolygonFromCoords = (coordinates: any, geometryType: string): google.maps.Polygon[] => {
      const polygons: google.maps.Polygon[] = [];

      if (geometryType === 'Polygon') {
        const outerRing = coordinates[0].map((coord: [number, number]) =>
          new window.google.maps.LatLng(coord[1], coord[0])
        );
        const holes = coordinates.slice(1).map((hole: [number, number][]) =>
          hole.map((coord: [number, number]) => new window.google.maps.LatLng(coord[1], coord[0]))
        );

        const paths = holes.length > 0 ? [outerRing, ...holes] : outerRing;
        polygons.push(new window.google.maps.Polygon({ paths }));
      } else if (geometryType === 'MultiPolygon') {
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

    const matchesLocation = (layer: any) =>
      layer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
      layer.state === currentLocation.state;

    const floodData = environmentalLayers.find((layer) =>
      layer.layer_type === 'flood_zones' && matchesLocation(layer)
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

    const protectedData = environmentalLayers.find((layer) =>
      layer.environmental_type === 'protected_lands' && matchesLocation(layer)
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

    const soilsWetlandsData = environmentalLayers.filter((layer) =>
      (layer.environmental_type === 'soils' || layer.environmental_type === 'wetlands') &&
      matchesLocation(layer)
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
    if (!mapInstanceRef.current) return;

    const enabledLayers = layers.filter((l) => l.enabled);
    if (enabledLayers.length === 0) return;

    const intersections: string[] = [];

    enabledLayers.forEach((layer) => {
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

    if (intersections.length > 0) {
      const message = intersections.length === 1
        ? intersections[0]
        : `Property intersects with ${intersections.length} layers: ${intersections.join(', ')}`;

      toast.warning('Layer Intersection Detected!', { description: message });

      setAnalysisResults((prev) => [...prev, {
        id: Date.now().toString(),
        analysis_type: 'Layer Intersection',
        input_layer_ids: enabledLayers.map((l) => l.id),
        result_data: {
          intersections,
          location: { lat, lng },
          message
        },
        parameters: { layers: enabledLayers.map((l) => l.name) },
        created_at: new Date().toISOString(),
        user_id: 'current-user'
      }]);
    }
  };

  const checkFloodZoneIntersection = (lat: number, lng: number): string | null => {
    const point = new google.maps.LatLng(lat, lng);

    for (const polygon of floodZoneOverlaysRef.current) {
      if (google.maps.geometry.poly.containsLocation(point, polygon)) {
        polygon.setOptions({ strokeColor: '#fbbf24', strokeWeight: 4, fillOpacity: 0.7 });
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
        polygon.setOptions({ strokeColor: '#fbbf24', strokeWeight: 4, fillOpacity: 0.7 });
        setTimeout(() => {
          polygon.setOptions({
            strokeColor: polygon.get('originalStrokeColor') || '#9333ea',
            strokeWeight: 2,
            fillOpacity: polygon.get('originalFillOpacity') || 0.35
          });
        }, 3000);

        return 'Protected Area (Conservation land)';
      }
    }
    return null;
  };

  const checkSoilsWetlandsIntersection = (_lat: number, _lng: number): string | null => {
    const soilsLayers = environmentalLayers.filter((layer) =>
      layer.environmental_type === 'soils' &&
      layer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
      layer.state === currentLocation.state
    );

    const wetlandsLayers = environmentalLayers.filter((layer) =>
      layer.environmental_type === 'wetlands' &&
      layer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
      layer.state === currentLocation.state
    );

    const intersections = [];

    if (soilsLayers.length > 0) {
      intersections.push('NRCS Soil Survey (soil type information available)');
    }
    if (wetlandsLayers.length > 0) {
      intersections.push('USFWS Wetlands (regulated wetland area)');
    }

    return intersections.length > 0 ? intersections.join(', ') : null;
  };

  const analyzePropertyEnvironment = async (lat: number, lng: number, place: google.maps.places.PlaceResult) => {
    setIsAnalyzing(true);
    setEnvironmentalAnalysis(null);

    try {
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

      if (data && typeof data === 'object') {
        const transformedData: EnvironmentalAnalysis = {
          floodRisk: data.floodRisk || (data.floodLevel ? {
            level: String(data.floodLevel),
            severity: String(data.floodSeverity || 'low'),
            description: String(data.description || 'No flood risk information available')
          } : undefined),
          soilType: data.soilType || (data.soilDescription ? {
            description: String(data.soilDescription)
          } : undefined),
          protectedAreas: Array.isArray(data.protectedAreas) ? data.protectedAreas.map((area: any) => ({
            name: String(area.name || area),
            distance: String(area.distance || 'Unknown distance')
          })) : []
        };

        setEnvironmentalAnalysis(transformedData);
      } else {
        console.warn('Invalid environmental analysis response:', data);
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
      await runIntersectionAnalysis(layers.filter((l) => l.enabled).map((l) => l.id));

      const analysisResult: SpatialAnalysisResult = {
        coordinates: { lat, lng },
        intersections: [
          {
            type: 'Spatial Analysis',
            description: `Analysis completed for coordinates (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            severity: 'info'
          }
        ]
      };

      // Real flood-zone intersection check (no Math.random injection, no Florida special-case)
      const floodLayer = environmentalLayers.find((layer) =>
        layer.layer_type === 'flood_zones' &&
        layer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
        layer.state === currentLocation.state
      );

      if (floodLayer && layers.find((l) => l.id === 'flood_zones')?.enabled) {
        const point = new google.maps.LatLng(lat, lng);
        let matched: string | null = null;

        try {
          const geometryData = typeof floodLayer.geometry_data === 'string'
            ? JSON.parse(floodLayer.geometry_data)
            : floodLayer.geometry_data;

          for (const feature of geometryData?.features || []) {
            const coords = feature?.geometry?.coordinates;
            if (!coords) continue;

            const ring = (feature.geometry.type === 'Polygon')
              ? coords[0]
              : coords[0]?.[0];

            if (!Array.isArray(ring)) continue;

            const path = ring.map((c: [number, number]) => new google.maps.LatLng(c[1], c[0]));
            const poly = new google.maps.Polygon({ paths: path });
            if (google.maps.geometry.poly.containsLocation(point, poly)) {
              matched = String(feature?.properties?.FLD_ZONE ?? 'Unknown');
              break;
            }
          }
        } catch (err) {
          console.error('Flood-zone scan error:', err);
        }

        if (matched) {
          const isHighRisk = ['AE', 'VE', 'AH', 'AO', 'A'].some((c) => matched!.includes(c));
          analysisResult.intersections!.push({
            type: 'FEMA Flood Zone',
            description: isHighRisk
              ? `Located in FEMA Zone ${matched} — Special flood hazard area requiring flood insurance`
              : `Located in FEMA Zone ${matched} — Minimal flood risk area`,
            severity: isHighRisk ? 'warning' : 'info'
          });
        }
      }

      setAnalysisResults((prev) => [analysisResult, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed');
    }
  };

  const renderFloodZones = useCallback(() => {
    if (!mapInstanceRef.current) return;
    clearFloodZones();

    const floodData = environmentalLayers.find((envLayer) =>
      envLayer.layer_type === 'flood_zones' &&
      envLayer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
      envLayer.state === currentLocation.state
    );

    if (!floodData || !floodData.geometry_data) {
      console.log('No flood data available for', currentLocation.city, currentLocation.state);
      return;
    }

    try {
      const geometryData = typeof floodData.geometry_data === 'string'
        ? JSON.parse(floodData.geometry_data)
        : floodData.geometry_data;

      if (geometryData.features && Array.isArray(geometryData.features)) {
        console.log(`Rendering ${geometryData.features.length} flood zone features`);

        geometryData.features.forEach((feature: any, index: number) => {
          if (!feature.geometry?.coordinates) return;
          try {
            const floodZone = feature.properties?.FLD_ZONE || feature.properties?.flood_zone || 'Unknown';
            const riskLevel = feature.properties?.risk_level || 'moderate';

            let fillColor = '#3b82f6';
            let strokeColor = '#2563eb';
            let opacity = 0.35;

            if (riskLevel === 'high' || floodZone.includes('AE') || floodZone.includes('VE')) {
              fillColor = '#1d4ed8';
              strokeColor = '#1e40af';
              opacity = 0.5;
            } else if (riskLevel === 'moderate' || floodZone.includes('A')) {
              fillColor = '#3b82f6';
              strokeColor = '#2563eb';
              opacity = 0.4;
            } else {
              fillColor = '#60a5fa';
              strokeColor = '#3b82f6';
              opacity = 0.25;
            }

            let paths: google.maps.LatLngLiteral[] = [];

            if (feature.geometry.type === 'Polygon') {
              paths = feature.geometry.coordinates[0].map((coord: [number, number]) => ({ lat: coord[1], lng: coord[0] }));
            } else if (feature.geometry.type === 'MultiPolygon') {
              if (feature.geometry.coordinates[0]?.[0]) {
                paths = feature.geometry.coordinates[0][0].map((coord: [number, number]) => ({ lat: coord[1], lng: coord[0] }));
              }
            }

            if (paths.length === 0) return;

            const polygon = new google.maps.Polygon({
              paths,
              strokeColor,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor,
              fillOpacity: opacity
            });

            polygon.set('originalStrokeColor', strokeColor);
            polygon.set('originalFillOpacity', opacity);
            polygon.setMap(mapInstanceRef.current);
            floodZoneOverlaysRef.current.push(polygon);

            polygon.addListener('click', (event: any) => {
              const bfe = feature.properties?.STATIC_BFE;
              const bfeText = bfe && bfe > 0
                ? `<p style="margin: 4px 0;"><strong>Base Flood Elevation:</strong> ${escapeHtml(bfe)} ft</p>`
                : '';
              const content = `
                <div style="color: #333; max-width: 280px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">FEMA Flood Zone</h3>
                  <p style="margin: 4px 0;"><strong>Zone:</strong> ${escapeHtml(floodZone)}</p>
                  <p style="margin: 4px 0;"><strong>Risk:</strong> ${escapeHtml(floodZoneExplanation(floodZone))}</p>
                  ${bfeText}
                  <p style="margin: 8px 0 4px 0; font-size: 12px;"><strong>For construction:</strong></p>
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #555;">${escapeHtml(constructionImplications(floodZone))}</p>
                  <p style="margin: 8px 0 0 0; font-size: 11px; color: #888;">Source: FEMA National Flood Hazard Layer</p>
                </div>
              `;
              const position = event?.latLng || paths[0];
              openInfoWindow(content, position);
            });
          } catch (featureError) {
            console.error(`Error rendering flood zone feature ${index}:`, featureError);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing flood zone geometry data:', error);
    }
  }, [environmentalLayers, currentLocation]);

  const clearFloodZones = useCallback(() => {
    floodZoneOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    floodZoneOverlaysRef.current = [];
  }, []);

  const renderProtectedAreas = useCallback(() => {
    if (!mapInstanceRef.current) return;
    clearProtectedAreas();

    const protectedData = environmentalLayers.find((envLayer) =>
      (envLayer.layer_type === 'environmental' || envLayer.layer_type === 'protected_lands') &&
      envLayer.environmental_type === 'protected_lands' &&
      envLayer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
      envLayer.state === currentLocation.state
    );

    if (!protectedData || !protectedData.geometry_data) {
      console.log('No protected areas for', currentLocation.city, currentLocation.state);
      return;
    }

    try {
      const geometryData = typeof protectedData.geometry_data === 'string'
        ? JSON.parse(protectedData.geometry_data)
        : protectedData.geometry_data;

      if (geometryData.features && Array.isArray(geometryData.features)) {
        geometryData.features.forEach((feature: any, index: number) => {
          if (!feature.geometry?.coordinates) return;

          try {
            const gapStatus = feature.properties?.GAP_Sts || '2';
            const unitName = feature.properties?.Unit_Nm || 'Protected Area';
            const managingAgency = feature.properties?.Mang_Name || 'Unknown Agency';

            let fillColor = '#a855f7';
            let strokeColor = '#9333ea';
            let opacity = 0.3;

            if (gapStatus === '1') {
              fillColor = '#7c3aed';
              strokeColor = '#6d28d9';
              opacity = 0.5;
            } else if (gapStatus === '2') {
              fillColor = '#8b5cf6';
              strokeColor = '#7c3aed';
              opacity = 0.4;
            } else if (gapStatus === '3') {
              fillColor = '#a855f7';
              strokeColor = '#9333ea';
              opacity = 0.35;
            } else {
              fillColor = '#c084fc';
              strokeColor = '#a855f7';
              opacity = 0.25;
            }

            let paths: google.maps.LatLngLiteral[] = [];

            if (feature.geometry.type === 'Polygon') {
              paths = feature.geometry.coordinates[0].map((coord: [number, number]) => ({ lat: coord[1], lng: coord[0] }));
            } else if (feature.geometry.type === 'MultiPolygon') {
              if (feature.geometry.coordinates[0]?.[0]) {
                paths = feature.geometry.coordinates[0][0].map((coord: [number, number]) => ({ lat: coord[1], lng: coord[0] }));
              }
            }

            if (paths.length === 0) return;

            const polygon = new google.maps.Polygon({
              paths,
              strokeColor,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor,
              fillOpacity: opacity
            });

            polygon.set('originalStrokeColor', strokeColor);
            polygon.set('originalFillOpacity', opacity);
            polygon.setMap(mapInstanceRef.current);
            protectedAreaOverlaysRef.current.push(polygon);

            polygon.addListener('click', (event: any) => {
              const protectionType = feature.properties?.Des_Tp || 'Protected Land';
              const content = `
                <div style="color: #333; max-width: 280px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${escapeHtml(unitName)}</h3>
                  <p style="margin: 4px 0;"><strong>Protection Type:</strong> ${escapeHtml(protectionType)}</p>
                  <p style="margin: 4px 0;"><strong>Managing Agency:</strong> ${escapeHtml(managingAgency)}</p>
                  <p style="margin: 4px 0;"><strong>GAP Status:</strong> ${escapeHtml(gapStatus)}</p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #555;">Development restrictions may apply near protected areas.</p>
                  <p style="margin: 6px 0 0 0; font-size: 11px; color: #888;">Source: USGS PAD-US</p>
                </div>
              `;
              const position = event?.latLng || paths[0];
              openInfoWindow(content, position);
            });
          } catch (featureError) {
            console.error(`Error rendering protected area feature ${index}:`, featureError);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing protected areas geometry data:', error);
    }
  }, [environmentalLayers, currentLocation]);

  const clearProtectedAreas = useCallback(() => {
    protectedAreaOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    protectedAreaOverlaysRef.current = [];
  }, []);

  const renderSoilsWetlands = useCallback(() => {
    if (!mapInstanceRef.current) return;
    clearSoilsWetlands();

    const soilsData = environmentalLayers.find((envLayer) =>
      (envLayer.environmental_type === 'soils' || envLayer.layer_type === 'soil_conditions') &&
      envLayer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
      envLayer.state === currentLocation.state
    );

    const wetlandsData = environmentalLayers.find((envLayer) =>
      envLayer.environmental_type === 'wetlands' &&
      envLayer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
      envLayer.state === currentLocation.state
    );

    if (soilsData?.geometry_data?.features) {
      soilsData.geometry_data.features.forEach((feature: any) => {
        if (!feature.geometry?.coordinates) return;
        try {
          const paths = feature.geometry.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }));

          const polygon = new google.maps.Polygon({
            paths,
            strokeColor: '#8B4513',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#DEB887',
            fillOpacity: 0.4
          });

          polygon.setMap(mapInstanceRef.current);
          soilsWetlandsOverlaysRef.current.push(polygon);

          polygon.addListener('click', (event: any) => {
            const hydgrp = String(feature.properties?.HYDGRP || '');
            const hydric = hydgrp.startsWith('D') || hydgrp.includes('D');
            const content = `
              <div style="color: #333; max-width: 280px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Soil Map Unit</h3>
                <p style="margin: 4px 0;"><strong>Name:</strong> ${escapeHtml(feature.properties?.MUNAME || 'Unknown')}</p>
                <p style="margin: 4px 0;"><strong>Drainage Class:</strong> ${escapeHtml(feature.properties?.DRCLASSDCD || 'Unknown')}</p>
                <p style="margin: 4px 0;"><strong>Hydrologic Group:</strong> ${escapeHtml(hydgrp || 'Unknown')}</p>
                <p style="margin: 4px 0;"><strong>Hydric (wetland soil):</strong> ${hydric ? 'Yes' : 'No'}</p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #888;">Source: USDA NRCS SSURGO</p>
              </div>
            `;
            const position = event?.latLng || { lat: paths[0].lat, lng: paths[0].lng };
            openInfoWindow(content, position);
          });
        } catch (error) {
          console.error('Error rendering soil polygon:', error);
        }
      });
    }

    if (wetlandsData?.geometry_data?.features) {
      wetlandsData.geometry_data.features.forEach((feature: any) => {
        if (!feature.geometry?.coordinates) return;
        try {
          const paths = feature.geometry.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }));

          const polygon = new google.maps.Polygon({
            paths,
            strokeColor: '#006994',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#87CEEB',
            fillOpacity: 0.5
          });

          polygon.setMap(mapInstanceRef.current);
          soilsWetlandsOverlaysRef.current.push(polygon);

          polygon.addListener('click', (event: any) => {
            const code = feature.properties?.WETLAND_TY || feature.properties?.WETLAND_TYPE;
            const plain = cowardinPlainEnglish(code);
            const content = `
              <div style="color: #333; max-width: 280px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Wetland</h3>
                <p style="margin: 4px 0;"><strong>Cowardin Code:</strong> ${escapeHtml(code || 'Unknown')}</p>
                <p style="margin: 4px 0;"><strong>Classification:</strong> ${escapeHtml(plain)}</p>
                <p style="margin: 4px 0;"><strong>System:</strong> ${escapeHtml(feature.properties?.SYSTEM || 'Unknown')}</p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #888;">Source: USFWS National Wetlands Inventory</p>
              </div>
            `;
            const position = event?.latLng || { lat: paths[0].lat, lng: paths[0].lng };
            openInfoWindow(content, position);
          });
        } catch (error) {
          console.error('Error rendering wetland polygon:', error);
        }
      });
    }
  }, [environmentalLayers, currentLocation]);

  const clearSoilsWetlands = useCallback(() => {
    soilsWetlandsOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    soilsWetlandsOverlaysRef.current = [];
  }, []);

  useEffect(() => {
    const floodLayer = layers.find((l) => l.id === 'flood_zones');
    if (floodLayer?.enabled && mapInstanceRef.current) {
      renderFloodZones();
    } else {
      clearFloodZones();
    }
  }, [layers, renderFloodZones, clearFloodZones]);

  useEffect(() => {
    const protectedLayer = layers.find((l) => l.id === 'protected_lands');
    if (protectedLayer?.enabled && mapInstanceRef.current) {
      renderProtectedAreas();
    } else {
      clearProtectedAreas();
    }
  }, [layers, renderProtectedAreas, clearProtectedAreas]);

  useEffect(() => {
    const soilsWetlandsLayer = layers.find((l) => l.id === 'soils_wetlands');
    if (soilsWetlandsLayer?.enabled && mapInstanceRef.current) {
      renderSoilsWetlands();
    } else {
      clearSoilsWetlands();
    }
  }, [layers, renderSoilsWetlands, clearSoilsWetlands]);

  const toggleLayer = async (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    const isEnabling = !layer?.enabled;

    setLayers((prev) => prev.map((l) =>
      l.id === layerId ? { ...l, enabled: !l.enabled } : l
    ));

    if (!currentLocation.city || !currentLocation.state) {
      if (isEnabling) {
        toast.info('Search for a location first to load layer data');
      }
      return;
    }

    const locationParams = {
      city: currentLocation.city,
      state: currentLocation.state,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng
    };

    if (isEnabling && layerId === 'flood_zones') {
      try {
        await fetchFEMAFloodData(locationParams);
      } catch (error) {
        console.error('Error fetching FEMA flood data:', error);
        toast.error('Failed to fetch FEMA flood data');
      }
    }

    if (isEnabling && layerId === 'protected_lands') {
      try {
        await fetchEnvironmentalData({ ...locationParams, dataTypes: ['protected_lands'] });
      } catch (error) {
        console.error('Error fetching protected areas data:', error);
        toast.error('Failed to load protected areas data');
      }
    }

    if (isEnabling && layerId === 'soils_wetlands') {
      try {
        await fetchEnvironmentalData({ ...locationParams, dataTypes: ['soils_wetlands'] });
      } catch (error) {
        console.error('Error fetching soils and wetlands data:', error);
        toast.error('Failed to fetch soils and wetlands data');
      }
    }

    if (selectedProperty) {
      checkLayerIntersections(
        selectedProperty.location.lat(),
        selectedProperty.location.lng()
      );
    }
  };

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    if (selectedProperty && window.google?.maps?.geometry?.poly && environmentalLayers.length > 0) {
      const lat = selectedProperty.location.lat();
      const lng = selectedProperty.location.lng();
      computeCombinedAnalysis(lat, lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty, environmentalLayers, currentLocation]);

  // Analysis summary used by the on-map Risk Overlay card
  const hasSearched = !!(currentLocation.city && currentLocation.state);
  const analysisSummary = useMemo(() => {
    if (!hasSearched) return null;
    return buildAnalysisSummary(
      environmentalLayers || [],
      currentLocation.city,
      currentLocation.state,
      currentLocation.lat,
      currentLocation.lng
    );
  }, [environmentalLayers, currentLocation, hasSearched]);

  const showOverlayCard = hasSearched && showRiskOverlay && analysisSummary !== null;
  const floodDotClass = (level: string) => {
    if (level === 'HIGH') return 'bg-red-500';
    if (level === 'MODERATE') return 'bg-orange-500';
    if (level === 'LOW') return 'bg-green-500';
    return 'bg-muted-foreground/40';
  };

  if (apiKeyError) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border text-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">Google Maps API Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">{apiKeyError}</p>
            <p className="text-sm text-muted-foreground">
              Please ensure the GOOGLE_MAPS_API_KEY is properly configured in your Supabase secrets.
            </p>
            <div className="mt-4">
              <Button
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                className="bg-background text-foreground"
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
      {/* Search Bar */}
      <div className="mb-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="space-y-3">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search any US address — e.g. '1600 Pennsylvania Ave, Washington, DC'"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                disabled={isLoading}
              />

              {currentLocation.city && (
                <div className="bg-card/50 rounded-md p-3 border border-border">
                  <p className="font-medium text-sm text-foreground">
                    Analyzing: {currentLocation.city}{currentLocation.state ? `, ${currentLocation.state}` : ''}
                  </p>
                  {currentLocation.displayName && currentLocation.displayName !== `${currentLocation.city}, ${currentLocation.state}` && (
                    <p className="text-xs text-muted-foreground mt-1">{currentLocation.displayName}</p>
                  )}
                </div>
              )}

              {isAnalyzing && (
                <div className="bg-blue-500/10 rounded-md p-3 border border-blue-500/20">
                  <p className="text-sm text-blue-600">Analyzing environmental factors...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-6">
        <div className="flex-shrink-0">
          <GISSidebar
            isCollapsed={false}
            onToggleCollapsed={() => {}}
            mapInstance={mapInstanceRef.current}
            selectedProperty={selectedProperty}
            combinedAnalysis={combinedAnalysis}
            currentLocation={currentLocation}
            layers={layers}
            onToggleLayer={toggleLayer}
            environmentalLayers={environmentalLayers}
            isFetching={isFetching}
            disasterHistory={disasterHistory}
            disasterHistoryLoading={disasterHistoryLoading}
            lastAnalyzedAt={lastAnalyzedAt}
          />
        </div>

        <div className="flex-1">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="relative">
                <div ref={mapRef} className="w-full h-[600px] rounded-lg bg-card" />

                {showOverlayCard && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur rounded-xl shadow-lg px-6 py-3 flex items-center gap-6 border border-border">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground leading-tight">Analyzing</span>
                        <span className="text-sm font-semibold text-foreground leading-tight">
                          {currentLocation.city}{currentLocation.state ? `, ${currentLocation.state}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className={`inline-block w-3 h-3 rounded-full ${floodDotClass(analysisSummary!.flood.riskLevel)}`} />
                          <span className="text-[10px] text-muted-foreground mt-1">Flood</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`inline-block w-3 h-3 rounded-full ${analysisSummary!.protected.count > 0 ? 'bg-blue-500' : 'bg-muted-foreground/40'}`} />
                          <span className="text-[10px] text-muted-foreground mt-1">Protected</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`inline-block w-3 h-3 rounded-full ${analysisSummary!.soils.wetlandsPresent ? 'bg-teal-500' : 'bg-muted-foreground/40'}`} />
                          <span className="text-[10px] text-muted-foreground mt-1">Wetlands</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRiskOverlay(false)}
                        className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss risk overlay"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-foreground">Loading Google Maps...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
