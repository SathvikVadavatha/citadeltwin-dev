
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

// NYC Open Data API endpoints
const NYC_API_ENDPOINTS = {
  parcels: 'https://data.cityofnewyork.us/resource/dviv-y5y2.json',
  roads: 'https://data.cityofnewyork.us/resource/exjm-f27b.json',
  utilities: 'https://data.cityofnewyork.us/resource/ig8b-77rs.json'
};

// LA City API endpoints  
const LA_API_ENDPOINTS = {
  parcels: 'https://data.lacity.org/resource/4ca8-mxuh.json',
  roads: 'https://data.lacity.org/resource/7nbm-4pc4.json',
  utilities: 'https://data.lacity.org/resource/9yda-i4ya.json'
};

// Cuyahoga County API endpoints
const CUYAHOGA_API_ENDPOINTS = {
  parcels: 'https://opendata.arcgis.com/datasets/cuyahogacounty::parcels.geojson',
  roads: 'https://opendata.arcgis.com/datasets/cuyahogacounty::centerline.geojson',
  utilities: 'https://opendata.arcgis.com/datasets/cuyahogacounty::utilities.geojson'
};

// Orange County FL API endpoints
const ORANGE_FL_API_ENDPOINTS = {
  parcels: 'https://services1.arcgis.com/NkWDB5HNHlGOz4FW/arcgis/rest/services/Parcels/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson',
  roads: 'https://services1.arcgis.com/NkWDB5HNHlGOz4FW/arcgis/rest/services/Roads/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson',
  utilities: 'https://services1.arcgis.com/NkWDB5HNHlGOz4FW/arcgis/rest/services/Utilities/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson'
};

// Hillsborough County FL API endpoints
const HILLSBOROUGH_FL_API_ENDPOINTS = {
  parcels: 'https://gis-hillsboroughcounty.opendata.arcgis.com/datasets/hillsboroughcounty::parcels.geojson',
  roads: 'https://gis-hillsboroughcounty.opendata.arcgis.com/datasets/hillsboroughcounty::centerline.geojson',
  utilities: 'https://gis-hillsboroughcounty.opendata.arcgis.com/datasets/hillsboroughcounty::utilities.geojson'
};

const getLocationEndpoints = (locationCode: string) => {
  switch (locationCode) {
    case 'nyc': return NYC_API_ENDPOINTS;
    case 'la': return LA_API_ENDPOINTS;
    case 'chicago': return NYC_API_ENDPOINTS; // Default fallback
    case 'houston': return NYC_API_ENDPOINTS; // Default fallback
    case 'phoenix': return NYC_API_ENDPOINTS; // Default fallback
    case 'cuyahoga': return CUYAHOGA_API_ENDPOINTS;
    case 'orange-fl': return ORANGE_FL_API_ENDPOINTS;
    case 'hillsborough-fl': return HILLSBOROUGH_FL_API_ENDPOINTS;
    default: return NYC_API_ENDPOINTS; // Default to NYC
  }
};

const getLocationInfo = (locationCode: string) => {
  switch (locationCode) {
    case 'nyc': return { name: 'New York City', state: 'NY' };
    case 'la': return { name: 'Los Angeles', state: 'CA' };
    case 'chicago': return { name: 'Chicago', state: 'IL' };
    case 'houston': return { name: 'Houston', state: 'TX' };
    case 'phoenix': return { name: 'Phoenix', state: 'AZ' };
    case 'cuyahoga': return { name: 'Cuyahoga County', state: 'OH' };
    case 'orange-fl': return { name: 'Orange County', state: 'FL' };
    case 'hillsborough-fl': return { name: 'Hillsborough County', state: 'FL' };
    default: return { name: 'New York City', state: 'NY' };
  }
};

const fetchGISData = async (url: string, limit: number = 1000) => {
  try {
    const response = await fetch(`${url}?$limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CitadelTwin-GIS-Integration/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching GIS data:', error);
    throw error;
  }
};

const processGISData = (data: any[], layerType: string) => {
  // Process and standardize the GIS data
  const processedData = data.map((feature, index) => ({
    id: feature.id || `${layerType}_${index}`,
    type: 'Feature',
    properties: feature,
    geometry: feature.the_geom || feature.geometry || null
  }));

  return {
    type: 'FeatureCollection',
    features: processedData
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
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
      console.log(`Fetching GIS data for location: ${location}`);
      
      const locationInfo = getLocationInfo(location);
      const endpoints = getLocationEndpoints(location);
      const results = [];

      // Fetch data for each layer type
      for (const [layerType, url] of Object.entries(endpoints)) {
        try {
          console.log(`Fetching ${layerType} data from: ${url}`);
          
          const rawData = await fetchGISData(url, 500); // Limit to 500 records for demo
          const processedData = processGISData(rawData, layerType);
          const dataSize = JSON.stringify(processedData).length;

          const layerData: GISLayerData = {
            layer_name: `${locationInfo.name} ${layerType.charAt(0).toUpperCase() + layerType.slice(1)}`,
            layer_type: layerType as 'parcels' | 'roads' | 'utilities',
            description: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} data for ${locationInfo.name}, ${locationInfo.state}`,
            source_url: url,
            city: locationInfo.name,
            state: locationInfo.state,
            geometry_data: processedData,
            feature_count: processedData.features.length,
            data_size: dataSize,
            status: 'active',
            metadata: {
              fetched_at: new Date().toISOString(),
              source_format: 'GeoJSON',
              coordinate_system: 'WGS84'
            }
          };

          // Check if layer already exists
          const { data: existingLayer } = await supabase
            .from('gis_layers')
            .select('id')
            .eq('layer_name', layerData.layer_name)
            .single();

          if (existingLayer) {
            // Update existing layer
            const { data, error } = await supabase
              .from('gis_layers')
              .update(layerData)
              .eq('id', existingLayer.id)
              .select()
              .single();

            if (error) throw error;
            results.push({ action: 'updated', layer: data });
          } else {
            // Insert new layer
            const { data, error } = await supabase
              .from('gis_layers')
              .insert(layerData)
              .select()
              .single();

            if (error) throw error;
            results.push({ action: 'created', layer: data });
          }

          console.log(`Successfully processed ${layerType} layer with ${processedData.features.length} features`);
        } catch (error) {
          console.error(`Error processing ${layerType} layer:`, error);
          results.push({ action: 'error', layerType, error: error.message });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Processed GIS data for ${locationInfo.name}`,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'refresh_layer') {
      console.log(`Refreshing layer: ${layer_id}`);

      // Get layer info
      const { data: layer, error: layerError } = await supabase
        .from('gis_layers')
        .select('*')
        .eq('id', layer_id)
        .single();

      if (layerError || !layer) {
        throw new Error('Layer not found');
      }

      // Re-fetch data from source
      const rawData = await fetchGISData(layer.source_url, 500);
      const processedData = processGISData(rawData, layer.layer_type);
      const dataSize = JSON.stringify(processedData).length;

      // Update layer
      const { data: updatedLayer, error: updateError } = await supabase
        .from('gis_layers')
        .update({
          geometry_data: processedData,
          feature_count: processedData.features.length,
          data_size: dataSize,
          last_updated: new Date().toISOString(),
          metadata: {
            ...layer.metadata,
            last_refreshed: new Date().toISOString()
          }
        })
        .eq('id', layer_id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        success: true,
        message: 'Layer refreshed successfully',
        layer: updatedLayer
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('GIS ingestion error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
