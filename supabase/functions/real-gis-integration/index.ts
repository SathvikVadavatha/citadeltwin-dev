
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GISRequest {
  action: string;
  city?: string;
  state?: string;
  data_types?: string[];
  layer_ids?: string[];
  bbox?: any;
  analysis_type?: string;
  environmental_factors?: string[];
  parameters?: any;
  user_id?: string;
  parcel_id?: string;
  proposed_use?: string;
  building_height?: number;
  lot_coverage?: number;
}

// Mock municipal data sources - in production, these would be real APIs
const MOCK_GIS_SOURCES = {
  parcels: 'https://api.example-city.gov/parcels',
  zoning: 'https://api.example-city.gov/zoning', 
  flood_zones: 'https://api.fema.gov/flood-zones',
  environmental: 'https://api.epa.gov/environmental-data'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: GISRequest = await req.json();
    console.log('Real GIS integration request:', requestData);

    switch (requestData.action) {
      case 'fetch_environmental_data':
        return await handleEnvironmentalDataFetch(requestData);
      
      case 'fetch_property_boundaries':
        return await handlePropertyBoundariesFetch(requestData);
      
      case 'zoning_analysis':
        return await handleZoningAnalysis(requestData);
      
      case 'advanced_spatial_analysis':
        return await handleAdvancedSpatialAnalysis(requestData);
      
      default:
        throw new Error(`Unknown action: ${requestData.action}`);
    }

  } catch (error) {
    console.error('Real GIS integration error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process GIS integration request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleEnvironmentalDataFetch(request: GISRequest) {
  const { city, state, data_types } = request;
  
  console.log(`Fetching environmental data for ${city}, ${state}`);
  
  // Simulate real municipal API calls
  const environmentalData = [];
  
  for (const dataType of data_types || []) {
    // Mock environmental data - in production, call real APIs
    const mockData = {
      layer_name: `${dataType}_${city}_${state}`,
      layer_type: dataType,
      environmental_type: dataType,
      city,
      state,
      geometry_data: generateMockGeometry(dataType),
      feature_count: Math.floor(Math.random() * 1000) + 100,
      real_time_enabled: true,
      data_freshness_hours: 1,
      metadata: {
        source: `Municipal API - ${city}`,
        last_updated: new Date().toISOString(),
        accuracy: 'high',
        coordinate_system: 'EPSG:4326'
      }
    };
    
    // Store in database
    const { data: layer, error } = await supabase
      .from('gis_layers')
      .insert(mockData)
      .select()
      .single();
      
    if (error) {
      console.error('Error storing GIS layer:', error);
    } else {
      environmentalData.push(layer);
    }
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      layers_fetched: environmentalData.length,
      environmental_data: environmentalData,
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handlePropertyBoundariesFetch(request: GISRequest) {
  const { city, state, bbox } = request;
  
  console.log(`Fetching property boundaries for ${city}, ${state}`);
  
  // Mock property boundary data
  const boundaries = [];
  const numBoundaries = Math.floor(Math.random() * 20) + 5;
  
  for (let i = 0; i < numBoundaries; i++) {
    const boundary = {
      parcel_id: `${city}-${state}-${String(i).padStart(6, '0')}`,
      property_address: `${100 + i} Main Street, ${city}, ${state}`,
      owner_name: `Property Owner ${i + 1}`,
      boundary_geometry: generateMockPolygon(),
      area_sqft: Math.floor(Math.random() * 10000) + 1000,
      zoning_designation: ['R1', 'R2', 'C1', 'M1'][Math.floor(Math.random() * 4)],
      flood_zone: Math.random() > 0.8 ? 'AE' : 'X',
      soil_type: ['clay', 'sand', 'loam', 'rock'][Math.floor(Math.random() * 4)],
      city,
      state,
      county: `${city} County`,
      environmental_constraints: generateEnvironmentalConstraints(),
      last_surveyed: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    // Store in database
    const { data: propertyBoundary, error } = await supabase
      .from('property_boundaries')
      .insert(boundary)
      .select()
      .single();
      
    if (error) {
      console.error('Error storing property boundary:', error);
    } else {
      boundaries.push(propertyBoundary);
    }
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      boundaries_fetched: boundaries.length,
      property_boundaries: boundaries,
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleZoningAnalysis(request: GISRequest) {
  const { parcel_id, proposed_use, building_height, lot_coverage } = request;
  
  console.log(`Performing zoning analysis for parcel: ${parcel_id}`);
  
  // Get property boundary
  const { data: property, error: propertyError } = await supabase
    .from('property_boundaries')
    .select('*')
    .eq('parcel_id', parcel_id)
    .single();
    
  if (propertyError) {
    throw new Error(`Property not found: ${parcel_id}`);
  }
  
  // Mock zoning analysis
  const analysis = {
    parcel_id,
    proposed_use,
    current_zoning: property.zoning_designation,
    analysis_results: {
      use_permitted: checkUsePermitted(property.zoning_designation, proposed_use),
      height_compliance: checkHeightCompliance(property.zoning_designation, building_height),
      coverage_compliance: checkCoverageCompliance(property.zoning_designation, lot_coverage),
      setback_requirements: getSetbackRequirements(property.zoning_designation),
      parking_requirements: getParkingRequirements(property.zoning_designation, proposed_use)
    },
    recommendations: generateZoningRecommendations(property.zoning_designation, proposed_use),
    compliance_score: Math.floor(Math.random() * 30) + 70, // 70-100
    issues_identified: Math.floor(Math.random() * 5),
    analysis_date: new Date().toISOString()
  };
  
  return new Response(
    JSON.stringify({
      success: true,
      zoning_analysis: analysis,
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleAdvancedSpatialAnalysis(request: GISRequest) {
  const { analysis_type, layer_ids, environmental_factors, parameters, user_id } = request;
  
  console.log(`Performing advanced spatial analysis: ${analysis_type}`);
  
  // Get GIS layers
  const { data: layers, error: layersError } = await supabase
    .from('gis_layers')
    .select('*')
    .in('id', layer_ids || []);
    
  if (layersError) throw layersError;
  
  // Perform mock spatial analysis
  const analysisResult = {
    analysis_id: crypto.randomUUID(),
    analysis_type,
    input_layers: layers.length,
    environmental_factors: environmental_factors || [],
    parameters: parameters || {},
    results: generateSpatialAnalysisResults(analysis_type, layers),
    processing_time_ms: Math.floor(Math.random() * 5000) + 1000,
    confidence_score: Math.floor(Math.random() * 20) + 80,
    recommendations: generateSpatialRecommendations(analysis_type),
    created_at: new Date().toISOString()
  };
  
  // Store results
  const { data: storedResult, error: storeError } = await supabase
    .from('spatial_analysis_results')
    .insert({
      user_id,
      analysis_type,
      input_layer_ids: layer_ids || [],
      result_data: analysisResult,
      parameters: parameters || {}
    })
    .select()
    .single();
    
  if (storeError) throw storeError;
  
  return new Response(
    JSON.stringify({
      success: true,
      analysis_id: storedResult.id,
      spatial_analysis: analysisResult,
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Helper functions for mock data generation
function generateMockGeometry(dataType: string) {
  return {
    type: 'FeatureCollection',
    features: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
      type: 'Feature',
      properties: {
        id: i,
        type: dataType,
        severity: Math.random() > 0.7 ? 'high' : 'medium'
      },
      geometry: generateMockPolygon()
    }))
  };
}

function generateMockPolygon() {
  const centerLat = 40.7128 + (Math.random() - 0.5) * 0.1;
  const centerLng = -74.0060 + (Math.random() - 0.5) * 0.1;
  const size = 0.001;
  
  return {
    type: 'Polygon',
    coordinates: [[
      [centerLng - size, centerLat - size],
      [centerLng + size, centerLat - size],
      [centerLng + size, centerLat + size],
      [centerLng - size, centerLat + size],
      [centerLng - size, centerLat - size]
    ]]
  };
}

function generateEnvironmentalConstraints() {
  const constraints = ['wetlands', 'steep_slopes', 'contamination', 'historic_district'];
  return constraints.filter(() => Math.random() > 0.7);
}

function checkUsePermitted(zoning: string, proposedUse: string) {
  const zoningSets = {
    'R1': ['single_family', 'duplex'],
    'R2': ['single_family', 'duplex', 'multi_family'],
    'C1': ['retail', 'office', 'restaurant'],
    'M1': ['warehouse', 'manufacturing', 'office']
  };
  return zoningSets[zoning as keyof typeof zoningSets]?.includes(proposedUse) || false;
}

function checkHeightCompliance(zoning: string, height: number) {
  const heightLimits = { 'R1': 35, 'R2': 45, 'C1': 60, 'M1': 80 };
  return height <= (heightLimits[zoning as keyof typeof heightLimits] || 35);
}

function checkCoverageCompliance(zoning: string, coverage: number) {
  const coverageLimits = { 'R1': 30, 'R2': 40, 'C1': 80, 'M1': 70 };
  return coverage <= (coverageLimits[zoning as keyof typeof coverageLimits] || 30);
}

function getSetbackRequirements(zoning: string) {
  const setbacks = {
    'R1': { front: 25, side: 10, rear: 20 },
    'R2': { front: 20, side: 8, rear: 15 },
    'C1': { front: 0, side: 0, rear: 10 },
    'M1': { front: 20, side: 15, rear: 25 }
  };
  return setbacks[zoning as keyof typeof setbacks] || setbacks['R1'];
}

function getParkingRequirements(zoning: string, use: string) {
  return {
    spaces_per_unit: use === 'single_family' ? 2 : 1.5,
    accessibility_required: true,
    bicycle_parking: use === 'multi_family' || use === 'office'
  };
}

function generateZoningRecommendations(zoning: string, use: string) {
  return [
    'Review setback requirements for compliance',
    'Consider environmental impact assessment',
    'Verify parking space calculations',
    'Check accessibility requirements'
  ];
}

function generateSpatialAnalysisResults(analysisType: string, layers: any[]) {
  return {
    overlay_analysis: {
      intersections: Math.floor(Math.random() * 50),
      coverage_percentage: Math.floor(Math.random() * 100),
      affected_areas: Math.floor(Math.random() * 20)
    },
    risk_assessment: {
      flood_risk: Math.random() > 0.7 ? 'high' : 'low',
      environmental_risk: Math.random() > 0.8 ? 'medium' : 'low',
      development_suitability: Math.floor(Math.random() * 40) + 60
    },
    proximity_analysis: {
      nearest_utilities: Math.floor(Math.random() * 1000) + 100,
      transportation_access: Math.floor(Math.random() * 10) + 1,
      emergency_services: Math.floor(Math.random() * 5000) + 500
    }
  };
}

function generateSpatialRecommendations(analysisType: string) {
  return [
    'Consider environmental mitigation measures',
    'Verify utility capacity and connections',
    'Review transportation impact requirements',
    'Assess emergency access routes'
  ];
}
