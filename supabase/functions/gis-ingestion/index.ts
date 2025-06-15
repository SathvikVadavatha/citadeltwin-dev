
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GISLayerData {
  id?: string;
  layer_name: string;
  layer_type: 'parcels' | 'roads' | 'utilities';
  description: string;
  source_url: string;
  city: string;
  state: string;
  geometry_data: any;
  feature_count: number;
  data_size: number;
  status: 'active' | 'inactive' | 'updating';
  metadata: any;
}

// Enhanced API endpoints with fallbacks
const API_ENDPOINTS = {
  nyc: {
    parcels: 'https://data.cityofnewyork.us/resource/dviv-y5y2.json',
    roads: 'https://data.cityofnewyork.us/resource/exjm-f27b.json',
    utilities: 'https://data.cityofnewyork.us/resource/ig8b-77rs.json'
  },
  la: {
    parcels: 'https://data.lacity.org/resource/4ca8-mxuh.json',
    roads: 'https://data.lacity.org/resource/7nbm-4pc4.json',
    utilities: 'https://data.lacity.org/resource/9yda-i4ya.json'
  },
  chicago: {
    parcels: 'https://data.cityofchicago.org/resource/e62c-6rz8.json',
    roads: 'https://data.cityofchicago.org/resource/uexy-tpcf.json',
    utilities: 'https://data.cityofchicago.org/resource/n4j6-wkkf.json'
  },
  houston: {
    parcels: 'https://cohgis-mycity.opendata.arcgis.com/datasets/parcels.geojson',
    roads: 'https://cohgis-mycity.opendata.arcgis.com/datasets/streets.geojson',
    utilities: 'https://cohgis-mycity.opendata.arcgis.com/datasets/utilities.geojson'
  },
  phoenix: {
    parcels: 'https://www.phoenixopendata.com/dataset/parcels.json',
    roads: 'https://www.phoenixopendata.com/dataset/streets.json',
    utilities: 'https://www.phoenixopendata.com/dataset/utilities.json'
  },
  cuyahoga: {
    parcels: 'https://opendata.arcgis.com/datasets/cuyahogacounty::parcels.geojson',
    roads: 'https://opendata.arcgis.com/datasets/cuyahogacounty::centerline.geojson',
    utilities: 'https://opendata.arcgis.com/datasets/cuyahogacounty::utilities.geojson'
  },
  'orange-fl': {
    parcels: 'https://services1.arcgis.com/NkWDB5HNHlGOz4FW/arcgis/rest/services/Parcels/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson',
    roads: 'https://services1.arcgis.com/NkWDB5HNHlGOz4FW/arcgis/rest/services/Roads/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson',
    utilities: 'https://services1.arcgis.com/NkWDB5HNHlGOz4FW/arcgis/rest/services/Utilities/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson'
  },
  'hillsborough-fl': {
    parcels: 'https://gis-hillsboroughcounty.opendata.arcgis.com/datasets/hillsboroughcounty::parcels.geojson',
    roads: 'https://gis-hillsboroughcounty.opendata.arcgis.com/datasets/hillsboroughcounty::centerline.geojson',
    utilities: 'https://gis-hillsboroughcounty.opendata.arcgis.com/datasets/hillsboroughcounty::utilities.geojson'
  }
};

const LOCATION_INFO = {
  nyc: { name: 'New York City', state: 'NY' },
  la: { name: 'Los Angeles', state: 'CA' },
  chicago: { name: 'Chicago', state: 'IL' },
  houston: { name: 'Houston', state: 'TX' },
  phoenix: { name: 'Phoenix', state: 'AZ' },
  cuyahoga: { name: 'Cuyahoga County', state: 'OH' },
  'orange-fl': { name: 'Orange County', state: 'FL' },
  'hillsborough-fl': { name: 'Hillsborough County', state: 'FL' }
};

// Enhanced data fetching with retry logic and validation
const fetchGISDataWithRetry = async (url: string, retries = 3, limit = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching GIS data (attempt ${attempt}): ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}$limit=${limit}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CitadelTwin-GIS-Integration/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json') && !contentType?.includes('application/geo+json')) {
        console.warn(`Unexpected content type: ${contentType}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Empty or invalid response data');
      }

      console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 'unknown'} records`);
      return data;

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// Enhanced data processing with better validation
const processGISData = (data: any[], layerType: string) => {
  try {
    if (!Array.isArray(data)) {
      // Handle GeoJSON FeatureCollection
      if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        data = data.features;
      } else {
        throw new Error('Data is not an array or valid FeatureCollection');
      }
    }

    const processedFeatures = data
      .filter(feature => feature && typeof feature === 'object')
      .map((feature, index) => {
        // Handle different data formats
        let geometry = null;
        let properties = {};

        if (feature.geometry && feature.properties) {
          // GeoJSON format
          geometry = feature.geometry;
          properties = feature.properties;
        } else if (feature.the_geom) {
          // NYC Open Data format
          geometry = feature.the_geom;
          properties = { ...feature };
          delete properties.the_geom;
        } else {
          // Flat format, try to extract coordinates
          geometry = {
            type: 'Point',
            coordinates: [
              feature.longitude || feature.lng || feature.x || 0,
              feature.latitude || feature.lat || feature.y || 0
            ]
          };
          properties = feature;
        }

        return {
          id: feature.id || feature.objectid || feature.gid || `${layerType}_${index}`,
          type: 'Feature',
          properties: {
            ...properties,
            layer_type: layerType,
            processed_at: new Date().toISOString()
          },
          geometry
        };
      });

    return {
      type: 'FeatureCollection',
      features: processedFeatures,
      metadata: {
        total_features: processedFeatures.length,
        layer_type: layerType,
        processed_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing GIS data:', error);
    throw new Error(`Data processing failed: ${error.message}`);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, location, layer_id } = await req.json();

    if (action === 'fetch_city_data') {
      console.log(`Starting enhanced GIS data fetch for location: ${location}`);
      
      const locationInfo = LOCATION_INFO[location as keyof typeof LOCATION_INFO];
      if (!locationInfo) {
        throw new Error(`Unsupported location: ${location}`);
      }

      const endpoints = API_ENDPOINTS[location as keyof typeof API_ENDPOINTS];
      if (!endpoints) {
        throw new Error(`No API endpoints configured for location: ${location}`);
      }

      const results = [];
      const errors = [];

      // Process each layer type with enhanced error handling
      for (const [layerType, url] of Object.entries(endpoints)) {
        try {
          console.log(`Processing ${layerType} layer for ${locationInfo.name}`);
          
          const rawData = await fetchGISDataWithRetry(url, 3, 500);
          const processedData = processGISData(rawData, layerType);
          const dataSize = JSON.stringify(processedData).length;

          const layerData: GISLayerData = {
            layer_name: `${locationInfo.name} ${layerType.charAt(0).toUpperCase() + layerType.slice(1)}`,
            layer_type: layerType as 'parcels' | 'roads' | 'utilities',
            description: `Enhanced ${layerType} data for ${locationInfo.name}, ${locationInfo.state}`,
            source_url: url,
            city: locationInfo.name,
            state: locationInfo.state,
            geometry_data: processedData,
            feature_count: processedData.features.length,
            data_size: dataSize,
            status: 'active',
            metadata: {
              ...processedData.metadata,
              fetched_at: new Date().toISOString(),
              source_format: 'Enhanced GeoJSON',
              coordinate_system: 'WGS84',
              processing_version: '2.0'
            }
          };

          // Check if layer already exists and update or insert
          const { data: existingLayer } = await supabase
            .from('gis_layers')
            .select('id')
            .eq('layer_name', layerData.layer_name)
            .single();

          if (existingLayer) {
            const { data, error } = await supabase
              .from('gis_layers')
              .update(layerData)
              .eq('id', existingLayer.id)
              .select()
              .single();

            if (error) throw error;
            results.push({ action: 'updated', layer: data, features: processedData.features.length });
          } else {
            const { data, error } = await supabase
              .from('gis_layers')
              .insert(layerData)
              .select()
              .single();

            if (error) throw error;
            results.push({ action: 'created', layer: data, features: processedData.features.length });
          }

          console.log(`Successfully processed ${layerType}: ${processedData.features.length} features`);
        } catch (error) {
          console.error(`Error processing ${layerType}:`, error);
          errors.push({ layerType, error: error.message });
          results.push({ action: 'error', layerType, error: error.message });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Enhanced GIS data processing completed for ${locationInfo.name}`,
        results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total_layers: Object.keys(endpoints).length,
          successful: results.filter(r => r.action !== 'error').length,
          failed: errors.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'refresh_layer') {
      console.log(`Refreshing layer: ${layer_id}`);

      const { data: layer, error: layerError } = await supabase
        .from('gis_layers')
        .select('*')
        .eq('id', layer_id)
        .single();

      if (layerError || !layer) {
        throw new Error('Layer not found');
      }

      try {
        // Re-fetch with enhanced processing
        const rawData = await fetchGISDataWithRetry(layer.source_url, 3, 500);
        const processedData = processGISData(rawData, layer.layer_type);
        const dataSize = JSON.stringify(processedData).length;

        const { data: updatedLayer, error: updateError } = await supabase
          .from('gis_layers')
          .update({
            geometry_data: processedData,
            feature_count: processedData.features.length,
            data_size: dataSize,
            last_updated: new Date().toISOString(),
            status: 'active',
            metadata: {
              ...layer.metadata,
              last_refreshed: new Date().toISOString(),
              refresh_version: '2.0'
            }
          })
          .eq('id', layer_id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          success: true,
          message: 'Layer refreshed successfully with enhanced processing',
          layer: updatedLayer,
          features_processed: processedData.features.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        // Update layer status to indicate refresh failure
        await supabase
          .from('gis_layers')
          .update({
            status: 'inactive',
            metadata: {
              ...layer.metadata,
              last_refresh_error: error.message,
              last_refresh_attempt: new Date().toISOString()
            }
          })
          .eq('id', layer_id);

        throw error;
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action specified'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhanced GIS ingestion error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
