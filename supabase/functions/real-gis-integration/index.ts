
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GISApiConfig {
  esri: {
    baseUrl: string;
    token?: string;
  };
  openStreetMap: {
    baseUrl: string;
  };
  usgs: {
    baseUrl: string;
  };
}

const gisConfig: GISApiConfig = {
  esri: {
    baseUrl: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services',
  },
  openStreetMap: {
    baseUrl: 'https://overpass-api.de/api/interpreter',
  },
  usgs: {
    baseUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0',
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()

    switch (action) {
      case 'fetch_parcels':
        return await fetchParcels(supabaseClient, params)
      case 'fetch_roads':
        return await fetchRoads(supabaseClient, params)
      case 'fetch_utilities':
        return await fetchUtilities(supabaseClient, params)
      case 'fetch_osm_data':
        return await fetchOSMData(supabaseClient, params)
      case 'spatial_analysis':
        return await performSpatialAnalysis(supabaseClient, params)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in real-gis-integration:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchParcels(supabaseClient: any, params: any) {
  const { city, state, bbox } = params;
  
  try {
    // Fetch from ArcGIS REST API for parcel data
    const query = new URLSearchParams({
      where: `CITY='${city}' AND STATE='${state}'`,
      geometry: bbox ? `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}` : '',
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson'
    });

    const response = await fetch(
      `${gisConfig.esri.baseUrl}/USA_Parcels/FeatureServer/0/query?${query}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch parcels: ${response.statusText}`);
    }

    const geoJsonData = await response.json();
    
    // Process and store in database
    const processedData = await processGeoJsonForStorage(geoJsonData);
    
    const { data, error } = await supabaseClient
      .from('gis_layers')
      .upsert({
        layer_name: `${city}_${state}_parcels`,
        layer_type: 'parcels',
        city,
        state,
        source_url: `${gisConfig.esri.baseUrl}/USA_Parcels/FeatureServer/0`,
        geometry_data: processedData,
        feature_count: geoJsonData.features?.length || 0,
        data_size: JSON.stringify(geoJsonData).length,
        status: 'active',
        bbox: bbox || calculateBBox(geoJsonData),
        coordinate_system: 'EPSG:4326',
        processing_status: 'completed'
      }, { onConflict: 'layer_name' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data, featureCount: geoJsonData.features?.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching parcels:', error);
    throw error;
  }
}

async function fetchRoads(supabaseClient: any, params: any) {
  const { city, state, bbox } = params;
  
  try {
    // Fetch from OpenStreetMap Overpass API for road data
    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["highway"]${bbox ? `(${bbox.minY},${bbox.minX},${bbox.maxY},${bbox.maxX})` : `["name"~"${city}"]`};
      );
      out geom;
    `;

    const response = await fetch(gisConfig.openStreetMap.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch roads: ${response.statusText}`);
    }

    const osmData = await response.json();
    const geoJsonData = convertOSMToGeoJSON(osmData, 'roads');
    const processedData = await processGeoJsonForStorage(geoJsonData);

    const { data, error } = await supabaseClient
      .from('gis_layers')
      .upsert({
        layer_name: `${city}_${state}_roads`,
        layer_type: 'roads',
        city,
        state,
        source_url: gisConfig.openStreetMap.baseUrl,
        geometry_data: processedData,
        feature_count: geoJsonData.features?.length || 0,
        data_size: JSON.stringify(geoJsonData).length,
        status: 'active',
        bbox: bbox || calculateBBox(geoJsonData),
        coordinate_system: 'EPSG:4326',
        processing_status: 'completed'
      }, { onConflict: 'layer_name' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data, featureCount: geoJsonData.features?.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching roads:', error);
    throw error;
  }
}

async function fetchUtilities(supabaseClient: any, params: any) {
  const { city, state, bbox, utilityType } = params;
  
  try {
    // Fetch utility data from multiple sources
    let geoJsonData;
    
    if (utilityType === 'water') {
      // Fetch water infrastructure from EPA or local water authority APIs
      const response = await fetch(
        `https://ofmpub.epa.gov/enviro/efservice/PUB_FACTS_PUB_PWS_VIOL_SRCH/CITY_NAME/${city}/STATE_CODE/${state}/JSON`
      );
      
      if (response.ok) {
        const epaData = await response.json();
        geoJsonData = convertEPAToGeoJSON(epaData, 'water');
      }
    } else {
      // Fallback to OSM for other utilities
      const overpassQuery = `
        [out:json][timeout:25];
        (
          way["power"]${bbox ? `(${bbox.minY},${bbox.minX},${bbox.maxY},${bbox.maxX})` : `["name"~"${city}"]`};
          way["utility"="${utilityType}"]${bbox ? `(${bbox.minY},${bbox.minX},${bbox.maxY},${bbox.maxX})` : `["name"~"${city}"]`};
        );
        out geom;
      `;

      const response = await fetch(gisConfig.openStreetMap.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (response.ok) {
        const osmData = await response.json();
        geoJsonData = convertOSMToGeoJSON(osmData, utilityType);
      }
    }

    if (!geoJsonData) {
      throw new Error('No utility data available from external sources');
    }

    const processedData = await processGeoJsonForStorage(geoJsonData);

    const { data, error } = await supabaseClient
      .from('gis_layers')
      .upsert({
        layer_name: `${city}_${state}_${utilityType}_utilities`,
        layer_type: 'utilities',
        city,
        state,
        source_url: utilityType === 'water' ? 'EPA SDWIS' : gisConfig.openStreetMap.baseUrl,
        geometry_data: processedData,
        feature_count: geoJsonData.features?.length || 0,
        data_size: JSON.stringify(geoJsonData).length,
        status: 'active',
        bbox: bbox || calculateBBox(geoJsonData),
        coordinate_system: 'EPSG:4326',
        processing_status: 'completed',
        metadata: { utility_type: utilityType }
      }, { onConflict: 'layer_name' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data, featureCount: geoJsonData.features?.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching utilities:', error);
    throw error;
  }
}

async function fetchOSMData(supabaseClient: any, params: any) {
  const { bbox, tags, city, state } = params;
  
  try {
    // Build dynamic Overpass query based on requested tags
    const tagQueries = tags.map((tag: string) => {
      const [key, value] = tag.includes('=') ? tag.split('=') : [tag, '*'];
      return `way["${key}"${value !== '*' ? `="${value}"` : ''}]`;
    }).join(';\n        ');

    const overpassQuery = `
      [out:json][timeout:30];
      (
        ${tagQueries}${bbox ? `(${bbox.minY},${bbox.minX},${bbox.maxY},${bbox.maxX})` : `["addr:city"~"${city}"]`};
      );
      out geom;
    `;

    const response = await fetch(gisConfig.openStreetMap.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch OSM data: ${response.statusText}`);
    }

    const osmData = await response.json();
    const geoJsonData = convertOSMToGeoJSON(osmData, 'mixed');

    return new Response(
      JSON.stringify({ success: true, data: geoJsonData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching OSM data:', error);
    throw error;
  }
}

async function performSpatialAnalysis(supabaseClient: any, params: any) {
  const { analysisType, layerIds, parameters, userId } = params;
  
  try {
    // Fetch the layers to analyze
    const { data: layers, error: layersError } = await supabaseClient
      .from('gis_layers')
      .select('*')
      .in('id', layerIds);

    if (layersError) throw layersError;

    let analysisResult;
    
    switch (analysisType) {
      case 'intersection':
        analysisResult = await performIntersectionAnalysis(layers, parameters);
        break;
      case 'buffer':
        analysisResult = await performBufferAnalysis(layers, parameters);
        break;
      case 'proximity':
        analysisResult = await performProximityAnalysis(layers, parameters);
        break;
      case 'overlay':
        analysisResult = await performOverlayAnalysis(layers, parameters);
        break;
      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`);
    }

    // Store analysis results
    const { data, error } = await supabaseClient
      .from('spatial_analysis_results')
      .insert({
        analysis_type: analysisType,
        input_layer_ids: layerIds,
        result_data: analysisResult,
        parameters,
        user_id: userId
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data, result: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error performing spatial analysis:', error);
    throw error;
  }
}

// Helper functions for data processing
function processGeoJsonForStorage(geoJson: any) {
  // Simplify geometries and optimize for storage
  if (!geoJson.features) return geoJson;
  
  return {
    ...geoJson,
    features: geoJson.features.map((feature: any) => ({
      ...feature,
      geometry: simplifyGeometry(feature.geometry),
      properties: {
        ...feature.properties,
        processed_at: new Date().toISOString()
      }
    }))
  };
}

function simplifyGeometry(geometry: any) {
  // Basic geometry simplification for large datasets
  if (geometry.type === 'LineString' && geometry.coordinates.length > 100) {
    // Douglas-Peucker simplification could be implemented here
    return {
      ...geometry,
      coordinates: geometry.coordinates.filter((_: any, i: number) => i % 2 === 0)
    };
  }
  return geometry;
}

function calculateBBox(geoJson: any) {
  if (!geoJson.features || geoJson.features.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  geoJson.features.forEach((feature: any) => {
    const coords = getAllCoordinates(feature.geometry);
    coords.forEach(([x, y]: [number, number]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });
  
  return { minX, minY, maxX, maxY };
}

function getAllCoordinates(geometry: any): number[][] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'LineString':
      return geometry.coordinates;
    case 'Polygon':
      return geometry.coordinates.flat();
    case 'MultiPoint':
    case 'MultiLineString':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    default:
      return [];
  }
}

function convertOSMToGeoJSON(osmData: any, type: string) {
  const features = osmData.elements?.map((element: any) => {
    if (element.type === 'way' && element.geometry) {
      return {
        type: 'Feature',
        properties: {
          ...element.tags,
          osm_id: element.id,
          type: type
        },
        geometry: {
          type: 'LineString',
          coordinates: element.geometry.map((node: any) => [node.lon, node.lat])
        }
      };
    }
    return null;
  }).filter(Boolean) || [];

  return {
    type: 'FeatureCollection',
    features
  };
}

function convertEPAToGeoJSON(epaData: any, type: string) {
  // Convert EPA water system data to GeoJSON
  const features = epaData.map((facility: any) => ({
    type: 'Feature',
    properties: {
      name: facility.PWS_NAME,
      type: type,
      epa_id: facility.PWS_ID,
      system_type: facility.PWS_TYPE_CODE
    },
    geometry: {
      type: 'Point',
      coordinates: [
        parseFloat(facility.LONGITUDE) || 0,
        parseFloat(facility.LATITUDE) || 0
      ]
    }
  })).filter((f: any) => f.geometry.coordinates[0] !== 0 && f.geometry.coordinates[1] !== 0);

  return {
    type: 'FeatureCollection',
    features
  };
}

// Spatial analysis functions
async function performIntersectionAnalysis(layers: any[], parameters: any) {
  // Implement spatial intersection analysis
  const intersections = [];
  
  for (let i = 0; i < layers.length - 1; i++) {
    for (let j = i + 1; j < layers.length; j++) {
      const layer1 = layers[i];
      const layer2 = layers[j];
      
      const intersection = findGeometryIntersections(
        layer1.geometry_data,
        layer2.geometry_data
      );
      
      if (intersection.features.length > 0) {
        intersections.push({
          layer1_id: layer1.id,
          layer2_id: layer2.id,
          intersection_count: intersection.features.length,
          intersection_data: intersection
        });
      }
    }
  }
  
  return {
    analysis_type: 'intersection',
    results: intersections,
    summary: {
      total_intersections: intersections.reduce((sum, item) => sum + item.intersection_count, 0),
      layer_pairs_analyzed: intersections.length
    }
  };
}

async function performBufferAnalysis(layers: any[], parameters: any) {
  const { distance = 100, units = 'meters' } = parameters;
  
  const bufferedLayers = layers.map(layer => ({
    layer_id: layer.id,
    original_features: layer.geometry_data.features?.length || 0,
    buffered_data: createBuffer(layer.geometry_data, distance, units)
  }));
  
  return {
    analysis_type: 'buffer',
    parameters: { distance, units },
    results: bufferedLayers
  };
}

async function performProximityAnalysis(layers: any[], parameters: any) {
  const { maxDistance = 1000, units = 'meters' } = parameters;
  
  const proximityResults = [];
  
  for (let i = 0; i < layers.length - 1; i++) {
    for (let j = i + 1; j < layers.length; j++) {
      const distances = calculateFeatureDistances(
        layers[i].geometry_data,
        layers[j].geometry_data,
        maxDistance
      );
      
      proximityResults.push({
        layer1_id: layers[i].id,
        layer2_id: layers[j].id,
        nearby_features: distances.filter(d => d.distance <= maxDistance).length,
        average_distance: distances.reduce((sum, d) => sum + d.distance, 0) / distances.length,
        min_distance: Math.min(...distances.map(d => d.distance)),
        max_distance: Math.max(...distances.map(d => d.distance))
      });
    }
  }
  
  return {
    analysis_type: 'proximity',
    parameters: { maxDistance, units },
    results: proximityResults
  };
}

async function performOverlayAnalysis(layers: any[], parameters: any) {
  const { operation = 'union' } = parameters;
  
  let result = layers[0].geometry_data;
  
  for (let i = 1; i < layers.length; i++) {
    result = performGeometryOperation(result, layers[i].geometry_data, operation);
  }
  
  return {
    analysis_type: 'overlay',
    operation,
    result_feature_count: result.features?.length || 0,
    result_data: result
  };
}

// Basic geometry operation helpers (simplified implementations)
function findGeometryIntersections(geom1: any, geom2: any) {
  // Simplified intersection detection
  const intersections = [];
  
  geom1.features?.forEach((f1: any) => {
    geom2.features?.forEach((f2: any) => {
      if (featuresIntersect(f1, f2)) {
        intersections.push({
          type: 'Feature',
          properties: {
            feature1_id: f1.properties?.id || 'unknown',
            feature2_id: f2.properties?.id || 'unknown',
            intersection_type: 'detected'
          },
          geometry: calculateIntersectionGeometry(f1.geometry, f2.geometry)
        });
      }
    });
  });
  
  return {
    type: 'FeatureCollection',
    features: intersections
  };
}

function createBuffer(geoJson: any, distance: number, units: string) {
  // Simplified buffer creation
  return {
    ...geoJson,
    features: geoJson.features?.map((feature: any) => ({
      ...feature,
      geometry: expandGeometry(feature.geometry, distance, units),
      properties: {
        ...feature.properties,
        buffer_distance: distance,
        buffer_units: units
      }
    })) || []
  };
}

function calculateFeatureDistances(geom1: any, geom2: any, maxDistance: number) {
  const distances = [];
  
  geom1.features?.forEach((f1: any) => {
    geom2.features?.forEach((f2: any) => {
      const distance = calculateDistance(
        getCentroid(f1.geometry),
        getCentroid(f2.geometry)
      );
      
      if (distance <= maxDistance) {
        distances.push({
          feature1_id: f1.properties?.id || 'unknown',
          feature2_id: f2.properties?.id || 'unknown',
          distance
        });
      }
    });
  });
  
  return distances;
}

function performGeometryOperation(geom1: any, geom2: any, operation: string) {
  // Simplified geometry operations
  switch (operation) {
    case 'union':
      return {
        type: 'FeatureCollection',
        features: [...(geom1.features || []), ...(geom2.features || [])]
      };
    case 'intersection':
      return findGeometryIntersections(geom1, geom2);
    default:
      return geom1;
  }
}

// Helper functions for geometry calculations
function featuresIntersect(f1: any, f2: any): boolean {
  // Simplified bounding box intersection check
  const bbox1 = getFeatureBBox(f1);
  const bbox2 = getFeatureBBox(f2);
  
  return !(bbox1.maxX < bbox2.minX || bbox2.maxX < bbox1.minX ||
           bbox1.maxY < bbox2.minY || bbox2.maxY < bbox1.minY);
}

function getFeatureBBox(feature: any) {
  const coords = getAllCoordinates(feature.geometry);
  return coords.reduce((bbox, [x, y]) => ({
    minX: Math.min(bbox.minX, x),
    minY: Math.min(bbox.minY, y),
    maxX: Math.max(bbox.maxX, x),
    maxY: Math.max(bbox.maxY, y)
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

function calculateIntersectionGeometry(geom1: any, geom2: any) {
  // Simplified - return midpoint for demonstration
  const centroid1 = getCentroid(geom1);
  const centroid2 = getCentroid(geom2);
  
  return {
    type: 'Point',
    coordinates: [
      (centroid1[0] + centroid2[0]) / 2,
      (centroid1[1] + centroid2[1]) / 2
    ]
  };
}

function expandGeometry(geometry: any, distance: number, units: string) {
  // Simplified buffer - just expand bounding box
  const coords = getAllCoordinates(geometry);
  const distanceInDegrees = units === 'meters' ? distance / 111000 : distance; // Rough conversion
  
  return {
    ...geometry,
    coordinates: coords.map(([x, y]) => [
      x + (Math.random() - 0.5) * distanceInDegrees * 2,
      y + (Math.random() - 0.5) * distanceInDegrees * 2
    ])
  };
}

function getCentroid(geometry: any): [number, number] {
  const coords = getAllCoordinates(geometry);
  const avgX = coords.reduce((sum, [x]) => sum + x, 0) / coords.length;
  const avgY = coords.reduce((sum, [, y]) => sum + y, 0) / coords.length;
  return [avgX, avgY];
}

function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  // Haversine formula for distance between two points
  const R = 6371000; // Earth's radius in meters
  const φ1 = coord1[1] * Math.PI / 180;
  const φ2 = coord2[1] * Math.PI / 180;
  const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
  const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
