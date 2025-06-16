
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GISRequest {
  layer_type: string;
  city: string;
  state: string;
  refresh_data?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { layer_type, city, state, refresh_data }: GISRequest = await req.json();

    console.log(`Processing GIS request for ${layer_type} in ${city}, ${state}`);

    // Check for existing data
    const { data: existingLayers } = await supabaseClient
      .from('gis_layers')
      .select('*')
      .eq('layer_type', layer_type)
      .eq('city', city)
      .eq('state', state)
      .eq('status', 'active');

    // If data exists and refresh not requested, return existing
    if (existingLayers && existingLayers.length > 0 && !refresh_data) {
      return new Response(
        JSON.stringify({
          success: true,
          data: existingLayers,
          source: 'cached',
          message: 'Returned cached GIS data'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch real-time data asynchronously
    EdgeRuntime.waitUntil(fetchAndUpdateGISData(
      supabaseClient,
      layer_type,
      city,
      state
    ));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'GIS data update initiated',
        estimated_completion: '2-5 minutes'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in GIS integration:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function fetchAndUpdateGISData(
  supabaseClient: any,
  layerType: string,
  city: string,
  state: string
) {
  try {
    console.log(`Fetching GIS data for ${layerType} in ${city}, ${state}`);

    // Create update record
    const { data: updateRecord } = await supabaseClient
      .from('gis_data_updates')
      .insert({
        update_type: 'realtime_fetch',
        update_source: 'municipal_api',
        update_data: { layer_type: layerType, city, state },
        processing_status: 'pending'
      })
      .select()
      .single();

    let gisData;
    let sourceUrl;

    // Fetch data based on layer type
    switch (layerType) {
      case 'parcels':
        gisData = await fetchParcelData(city, state);
        sourceUrl = `https://gis.${city.toLowerCase()}.gov/parcels`;
        break;
      case 'roads':
        gisData = await fetchRoadData(city, state);
        sourceUrl = `https://gis.${city.toLowerCase()}.gov/streets`;
        break;
      case 'utilities':
        gisData = await fetchUtilityData(city, state);
        sourceUrl = `https://gis.${city.toLowerCase()}.gov/utilities`;
        break;
      case 'flood_zones':
        gisData = await fetchFloodZoneData(city, state);
        sourceUrl = 'https://hazards.fema.gov/gis/services';
        break;
      case 'zoning':
        gisData = await fetchZoningData(city, state);
        sourceUrl = `https://gis.${city.toLowerCase()}.gov/zoning`;
        break;
      default:
        throw new Error(`Unsupported layer type: ${layerType}`);
    }

    // Calculate bounding box
    const bbox = calculateBoundingBox(gisData.features);

    // Update or insert GIS layer
    const { error: layerError } = await supabaseClient
      .from('gis_layers')
      .upsert({
        layer_name: `${city} ${layerType}`,
        layer_type: layerType,
        city,
        state,
        source_url: sourceUrl,
        geometry_data: gisData,
        feature_count: gisData.features?.length || 0,
        data_size: JSON.stringify(gisData).length,
        bbox,
        coordinate_system: 'EPSG:4326',
        status: 'active',
        real_time_enabled: true,
        data_freshness_hours: getDataFreshnessHours(layerType),
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'layer_name,city,state'
      });

    if (layerError) throw layerError;

    // Update processing record
    await supabaseClient
      .from('gis_data_updates')
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', updateRecord.id);

    console.log(`Successfully updated GIS data for ${layerType} in ${city}, ${state}`);

  } catch (error) {
    console.error('Error fetching GIS data:', error);
    
    if (updateRecord) {
      await supabaseClient
        .from('gis_data_updates')
        .update({
          processing_status: 'failed',
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', updateRecord.id);
    }
  }
}

async function fetchParcelData(city: string, state: string) {
  // Mock parcel data - in real implementation, would call actual GIS APIs
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          parcel_id: '12345',
          owner: 'John Doe',
          address: '123 Main St',
          assessed_value: 250000,
          land_use: 'Residential'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-74.006, 40.7128],
            [-74.005, 40.7128],
            [-74.005, 40.7138],
            [-74.006, 40.7138],
            [-74.006, 40.7128]
          ]]
        }
      }
    ]
  };
}

async function fetchRoadData(city: string, state: string) {
  // Mock road data
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          road_name: 'Main Street',
          road_type: 'Secondary',
          speed_limit: 35,
          surface_type: 'Asphalt'
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-74.006, 40.7128],
            [-74.004, 40.7135]
          ]
        }
      }
    ]
  };
}

async function fetchUtilityData(city: string, state: string) {
  // Mock utility data
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          utility_type: 'Water',
          pipe_diameter: 8,
          material: 'Cast Iron',
          install_date: '1985-03-15'
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-74.006, 40.7128],
            [-74.005, 40.7130]
          ]
        }
      }
    ]
  };
}

async function fetchFloodZoneData(city: string, state: string) {
  // Mock flood zone data
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          flood_zone: 'X',
          risk_level: 'Minimal',
          base_elevation: 125.5
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-74.007, 40.7125],
            [-74.003, 40.7125],
            [-74.003, 40.7145],
            [-74.007, 40.7145],
            [-74.007, 40.7125]
          ]]
        }
      }
    ]
  };
}

async function fetchZoningData(city: string, state: string) {
  // Mock zoning data
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          zone_class: 'R-1',
          zone_description: 'Single Family Residential',
          max_height: 35,
          max_coverage: 0.3,
          min_lot_size: 7500
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-74.008, 40.7120],
            [-74.002, 40.7120],
            [-74.002, 40.7150],
            [-74.008, 40.7150],
            [-74.008, 40.7120]
          ]]
        }
      }
    ]
  };
}

function calculateBoundingBox(features: any[]): any {
  if (!features || features.length === 0) return null;

  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;

  features.forEach(feature => {
    const coords = feature.geometry.coordinates;
    
    function processCoords(coordinates: any) {
      if (Array.isArray(coordinates[0])) {
        coordinates.forEach(processCoords);
      } else {
        const [lng, lat] = coordinates;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
    }

    processCoords(coords);
  });

  return {
    southwest: [minLng, minLat],
    northeast: [maxLng, maxLat]
  };
}

function getDataFreshnessHours(layerType: string): number {
  switch (layerType) {
    case 'roads': return 168; // 1 week
    case 'utilities': return 24; // 1 day
    case 'parcels': return 720; // 30 days
    case 'flood_zones': return 8760; // 1 year
    case 'zoning': return 2160; // 90 days
    default: return 24;
  }
}
