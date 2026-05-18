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
  latitude?: number;
  longitude?: number;
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

const FEMA_NFHL_API = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer';

// Default center fallback (US geographic center) when no coordinates supplied
const US_CENTER = { lat: 39.5, lng: -98.35 };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: GISRequest = await req.json();
    console.log('Real GIS integration request:', requestData);

    if (requestData.action === 'scheduled_refresh') {
      console.log('Scheduled refresh action received (no-op without coordinates)');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Scheduled refresh acknowledged',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (requestData.action) {
      case 'fetch_environmental_data':
        return await handleEnvironmentalDataFetch(requestData);

      case 'fetch_property_boundaries':
        return await handlePropertyBoundariesFetch(requestData);

      case 'zoning_analysis':
        return await handleZoningAnalysis(requestData);

      case 'advanced_spatial_analysis':
        return await handleAdvancedSpatialAnalysis(requestData);

      case 'fetch_fema_flood_data':
        return await handleFEMAFloodDataFetch(requestData);

      case 'fetch_disaster_history':
        return await handleDisasterHistoryFetch(requestData);

      default:
        throw new Error(`Unknown action: ${requestData.action}`);
    }

  } catch (error) {
    console.error('Real GIS integration error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        details: 'Failed to process GIS integration request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Resolve county FIPS for any US coordinate via Census Geocoding API
async function getCountyFipsForLocation(lat: number, lng: number): Promise<{ fips: string; name: string }> {
  try {
    const url =
      'https://geocoding.geo.census.gov/geocoder/geographies/coordinates?' +
      'x=' + lng + '&y=' + lat +
      '&benchmark=Public_AR_Current' +
      '&vintage=Current_Current' +
      '&layers=Counties' +
      '&format=json';

    console.log('Census county lookup URL:', url);

    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Census API returned non-OK status:', response.status);
    } else {
      const data = await response.json();
      const county = data?.result?.geographies?.Counties?.[0];
      if (county) {
        const fips = String(county.STATE) + String(county.COUNTY);
        console.log('County FIPS resolved:', fips, county.NAME);
        return { fips, name: String(county.NAME || `County ${fips}`) };
      }
    }
  } catch (error) {
    console.error('Census FIPS lookup failed:', error);
  }

  console.warn('Falling back to default county FIPS (Orange County FL)');
  return { fips: '12095', name: 'Orange County, FL' };
}

async function handleEnvironmentalDataFetch(request: GISRequest) {
  const { city, state, data_types, latitude, longitude } = request;

  if (!city || !state) {
    throw new Error('City and state are required for environmental data fetch');
  }

  const center = {
    lat: typeof latitude === 'number' ? latitude : US_CENTER.lat,
    lng: typeof longitude === 'number' ? longitude : US_CENTER.lng
  };

  console.log(`Fetching environmental data for ${city}, ${state} @ (${center.lat}, ${center.lng})`);

  const environmentalData = [];

  for (const dataType of data_types || []) {
    if (dataType === 'flood_zones') {
      try {
        const floodData = await fetchFEMAFloodDataForLocation(city, state, center);
        if (floodData) {
          environmentalData.push(floodData);
          continue;
        }
      } catch (error) {
        console.error('Error fetching FEMA flood data:', error);
      }
    } else if (dataType === 'protected_lands') {
      try {
        const protectedData = await fetchPADUSProtectedAreasForLocation(city, state, center);
        if (protectedData) {
          environmentalData.push(protectedData);
          continue;
        }
      } catch (error) {
        console.error('Error fetching PAD-US protected areas data:', error);
      }
    } else if (dataType === 'soils' || dataType === 'soil_conditions') {
      try {
        const soilsData = await fetchNRCSSoilsForLocation(city, state, center);
        if (soilsData) {
          environmentalData.push(soilsData);
          continue;
        }
      } catch (error) {
        console.error('Error fetching NRCS soils data:', error);
      }
    } else if (dataType === 'wetlands') {
      try {
        const wetlandsData = await fetchWetlandsForLocation(city, state, center);
        if (wetlandsData) {
          environmentalData.push(wetlandsData);
          continue;
        }
      } catch (error) {
        console.error('Error fetching USFWS wetlands data:', error);
      }
    } else if (dataType === 'soils_wetlands') {
      try {
        const [soilsData, wetlandsData] = await Promise.all([
          fetchNRCSSoilsForLocation(city, state, center),
          fetchWetlandsForLocation(city, state, center)
        ]);
        if (soilsData) environmentalData.push(soilsData);
        if (wetlandsData) environmentalData.push(wetlandsData);
        continue;
      } catch (error) {
        console.error('Error fetching combined soils and wetlands data:', error);
      }
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
  const { city, state, latitude, longitude } = request;

  console.log(`Fetching property boundaries for ${city}, ${state}`);

  const center = {
    lat: typeof latitude === 'number' ? latitude : US_CENTER.lat,
    lng: typeof longitude === 'number' ? longitude : US_CENTER.lng
  };

  // Mock property boundary data — centered on the searched location, not Manhattan
  const boundaries = [];
  const numBoundaries = Math.floor(Math.random() * 20) + 5;

  for (let i = 0; i < numBoundaries; i++) {
    const boundary = {
      parcel_id: `${city}-${state}-${String(i).padStart(6, '0')}`,
      property_address: `${100 + i} Main Street, ${city}, ${state}`,
      owner_name: `Property Owner ${i + 1}`,
      boundary_geometry: generateMockPolygon(center),
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

  const { data: property, error: propertyError } = await supabase
    .from('property_boundaries')
    .select('*')
    .eq('parcel_id', parcel_id)
    .single();

  if (propertyError) {
    throw new Error(`Property not found: ${parcel_id}`);
  }

  const compliantChecks = [
    checkUsePermitted(property.zoning_designation, proposed_use || ''),
    checkHeightCompliance(property.zoning_designation, building_height || 0),
    checkCoverageCompliance(property.zoning_designation, lot_coverage || 0)
  ];
  const passedCount = compliantChecks.filter(Boolean).length;
  const complianceScore = Math.round((passedCount / compliantChecks.length) * 100);
  const issuesIdentified = compliantChecks.length - passedCount;

  const analysis = {
    parcel_id,
    proposed_use,
    current_zoning: property.zoning_designation,
    analysis_results: {
      use_permitted: compliantChecks[0],
      height_compliance: compliantChecks[1],
      coverage_compliance: compliantChecks[2],
      setback_requirements: getSetbackRequirements(property.zoning_designation),
      parking_requirements: getParkingRequirements(property.zoning_designation, proposed_use || '')
    },
    recommendations: generateZoningRecommendations(property.zoning_designation, proposed_use || ''),
    compliance_score: complianceScore,
    issues_identified: issuesIdentified,
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
  const startedAt = Date.now();

  console.log(`Performing advanced spatial analysis: ${analysis_type}`);

  const { data: layers, error: layersError } = await supabase
    .from('gis_layers')
    .select('*')
    .in('id', layer_ids || []);

  if (layersError) throw layersError;

  const results = generateSpatialAnalysisResults(analysis_type || '', layers || []);
  const hasRealData = (layers || []).some((l: any) => l?.metadata?.is_real_data === true);
  const confidenceScore = hasRealData ? 92 : 65;

  const analysisResult = {
    analysis_id: crypto.randomUUID(),
    analysis_type,
    input_layers: (layers || []).length,
    environmental_factors: environmental_factors || [],
    parameters: parameters || {},
    results,
    processing_time_ms: Date.now() - startedAt,
    confidence_score: confidenceScore,
    is_real_data: hasRealData,
    recommendations: generateSpatialRecommendations(analysis_type || ''),
    created_at: new Date().toISOString()
  };

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

// Mock polygon centered on the actual searched location (not Manhattan)
function generateMockPolygon(center: { lat: number; lng: number }) {
  const centerLat = center.lat + (Math.random() - 0.5) * 0.05;
  const centerLng = center.lng + (Math.random() - 0.5) * 0.05;
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

function getParkingRequirements(_zoning: string, use: string) {
  return {
    spaces_per_unit: use === 'single_family' ? 2 : 1.5,
    accessibility_required: true,
    bicycle_parking: use === 'multi_family' || use === 'office'
  };
}

function generateZoningRecommendations(_zoning: string, _use: string) {
  return [
    'Review setback requirements for compliance',
    'Consider environmental impact assessment',
    'Verify parking space calculations',
    'Check accessibility requirements'
  ];
}

// Spatial analysis driven by real layer metadata when available
function generateSpatialAnalysisResults(_analysisType: string, layers: any[]) {
  let highRiskFloodZones = 0;
  let totalFloodZones = 0;
  let totalProtectedAreas = 0;
  let totalSoilUnits = 0;
  let totalWetlands = 0;

  for (const layer of layers || []) {
    const features = layer?.geometry_data?.features || [];
    if (layer?.layer_type === 'flood_zones' || layer?.environmental_type === 'flood_zones') {
      totalFloodZones += features.length;
      for (const feature of features) {
        const zone = String(feature?.properties?.FLD_ZONE ?? '');
        if (['AE', 'VE', 'AH', 'AO', 'A'].some(code => zone.includes(code))) {
          highRiskFloodZones += 1;
        }
      }
    } else if (layer?.environmental_type === 'protected_lands') {
      totalProtectedAreas += features.length;
    } else if (layer?.environmental_type === 'soils') {
      totalSoilUnits += features.length;
    } else if (layer?.environmental_type === 'wetlands') {
      totalWetlands += features.length;
    }
  }

  const floodRiskScore = totalFloodZones > 0
    ? Math.round((highRiskFloodZones / totalFloodZones) * 100)
    : 0;

  const protectedAreaCoverage = Math.min(100, totalProtectedAreas * 5);

  return {
    overlay_analysis: {
      intersections: highRiskFloodZones + totalProtectedAreas + totalWetlands,
      coverage_percentage: protectedAreaCoverage,
      affected_areas: totalProtectedAreas + totalWetlands
    },
    risk_assessment: {
      flood_risk: floodRiskScore >= 50 ? 'high' : floodRiskScore >= 20 ? 'moderate' : 'low',
      flood_risk_score: floodRiskScore,
      environmental_risk: totalWetlands > 0 ? 'moderate' : 'low',
      development_suitability: Math.max(0, 100 - floodRiskScore - (totalWetlands * 3))
    },
    proximity_analysis: {
      total_flood_zones: totalFloodZones,
      high_risk_flood_zones: highRiskFloodZones,
      protected_areas_count: totalProtectedAreas,
      soil_units_count: totalSoilUnits,
      wetlands_count: totalWetlands
    }
  };
}

function generateSpatialRecommendations(_analysisType: string) {
  return [
    'Consider environmental mitigation measures',
    'Verify utility capacity and connections',
    'Review transportation impact requirements',
    'Assess emergency access routes'
  ];
}

// ============================================================================
// FEMA Flood Data — REAL fetch with synthetic fallback
// ============================================================================

async function handleFEMAFloodDataFetch(request: GISRequest) {
  const { city, state, latitude, longitude } = request;

  if (!city || !state) {
    throw new Error('City and state are required for FEMA flood data fetch');
  }

  const center = {
    lat: typeof latitude === 'number' ? latitude : US_CENTER.lat,
    lng: typeof longitude === 'number' ? longitude : US_CENTER.lng
  };

  console.log(`Fetching FEMA flood data for ${city}, ${state} @ (${center.lat}, ${center.lng})`);

  try {
    const floodData = await fetchFEMAFloodDataForLocation(city, state, center);

    if (!floodData) {
      throw new Error('No FEMA flood data available for this location');
    }

    return new Response(
      JSON.stringify({
        success: true,
        fema_flood_data: floodData,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('FEMA flood data fetch error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        details: 'Failed to fetch FEMA flood data'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function fetchFEMAFloodDataForLocation(city: string, state: string, center: { lat: number; lng: number }) {
  console.log(`Fetching FEMA data for ${city}, ${state}`);

  const { data: existingLayer, error: existingError } = await supabase
    .from('gis_layers')
    .select('*')
    .eq('layer_type', 'flood_zones')
    .eq('city', city)
    .eq('state', state)
    .eq('environmental_type', 'flood_zones')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!existingError && existingLayer) {
    const lastUpdated = new Date(existingLayer.created_at);
    const hoursAgo = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    const refreshThreshold = 336;

    if (hoursAgo < refreshThreshold) {
      console.log(`Using existing FEMA data for ${city}, ${state} (${Math.round(hoursAgo)} hours old)`);
      return existingLayer;
    } else {
      console.log(`FEMA data for ${city}, ${state} is stale, refreshing...`);
    }
  }

  const { fips: countyFips, name: countyName } = await getCountyFipsForLocation(center.lat, center.lng);

  const floodZoneData = await fetchFEMANFHLData(countyFips, center);

  const floodLayer = {
    layer_name: `FEMA_Flood_Zones_${city.replace(/[^A-Za-z0-9]/g, '_')}_${state}`,
    layer_type: 'flood_zones',
    environmental_type: 'flood_zones',
    description: `FEMA flood zones for ${city}, ${state}`,
    source_url: FEMA_NFHL_API,
    city,
    state,
    geometry_data: floodZoneData,
    feature_count: floodZoneData?.features?.length || 0,
    real_time_enabled: true,
    data_freshness_hours: 336,
    coordinate_system: 'EPSG:4326',
    processing_status: 'ready',
    metadata: {
      source: floodZoneData?.metadata?.source || 'FEMA NFHL',
      county_fips: countyFips,
      county_name: countyName,
      last_updated: new Date().toISOString(),
      accuracy: floodZoneData?.metadata?.is_real_data ? 'official' : 'estimated',
      is_real_data: floodZoneData?.metadata?.is_real_data === true,
      data_provider: 'Federal Emergency Management Agency',
      api_endpoint: FEMA_NFHL_API
    }
  };

  const { data: layer, error } = await supabase
    .from('gis_layers')
    .upsert(floodLayer, { onConflict: 'layer_name' })
    .select()
    .single();

  if (error) {
    console.error('Error storing FEMA flood layer:', error);
    throw error;
  }

  console.log(`Successfully stored FEMA flood data for ${city}, ${state} (real=${floodZoneData?.metadata?.is_real_data === true})`);
  return layer;
}

async function fetchFEMANFHLData(countyFips: string, center: { lat: number; lng: number }) {
  console.log('Fetching real FEMA NFHL data for:', center.lat, center.lng);

  const bbox = {
    xmin: center.lng - 0.15,
    ymin: center.lat - 0.15,
    xmax: center.lng + 0.15,
    ymax: center.lat + 0.15
  };

  const queryUrl =
    'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/' +
    'MapServer/28/query?' +
    'where=1%3D1' +
    '&geometry=' + bbox.xmin + ',' + bbox.ymin + ',' +
                   bbox.xmax + ',' + bbox.ymax +
    '&geometryType=esriGeometryEnvelope' +
    '&spatialRel=esriSpatialRelIntersects' +
    '&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE' +
    '&returnGeometry=true' +
    '&f=geojson' +
    '&outSR=4326';

  console.log('FEMA query URL:', queryUrl);

  try {
    const response = await fetch(queryUrl, {
      headers: { 'User-Agent': 'CitadelTwin/1.0' }
    });

    if (!response.ok) {
      console.error('FEMA API error:', response.status);
      console.log('FALLBACK DATA (FEMA non-OK response)');
      return generateRealisticFEMAFloodData(countyFips, center, bbox);
    }

    const geojson = await response.json();
    const featureCount = geojson?.features?.length || 0;
    console.log('FEMA real features received:', featureCount);

    if (featureCount === 0) {
      console.warn('No FEMA features for this area, using fallback');
      console.log('FALLBACK DATA (FEMA returned 0 features)');
      return generateRealisticFEMAFloodData(countyFips, center, bbox);
    }

    const highRiskZones = geojson.features.filter((f: any) => {
      const zone = String(f?.properties?.FLD_ZONE ?? '');
      return ['AE', 'AH', 'AO', 'A', 'VE'].some((code) => zone.includes(code));
    }).length;

    console.log('REAL DATA (FEMA NFHL)');

    return {
      type: 'FeatureCollection',
      features: geojson.features,
      metadata: {
        source: 'FEMA NFHL Live',
        county_fips: countyFips,
        generated_at: new Date().toISOString(),
        total_zones: featureCount,
        high_risk_zones: highRiskZones,
        is_real_data: true
      }
    };
  } catch (error) {
    console.error('FEMA fetch failed, using fallback:', error);
    console.log('FALLBACK DATA (FEMA exception)');
    return generateRealisticFEMAFloodData(countyFips, center, bbox);
  }
}

function generateRealisticFEMAFloodData(countyFips: string, center: { lat: number; lng: number }, _bbox: any) {
  console.log(`Generating fallback FEMA flood data near (${center.lat}, ${center.lng})`);

  const floodZoneTypes = ['AE', 'AH', 'AO', 'A', 'X', 'X500'];
  const features = [];
  const numZones = Math.floor(Math.random() * 15) + 10;

  for (let i = 0; i < numZones; i++) {
    const zoneType = floodZoneTypes[Math.floor(Math.random() * floodZoneTypes.length)];
    const isHighRisk = ['AE', 'AH', 'AO', 'A'].includes(zoneType);

    const offsetLat = (Math.random() - 0.5) * 0.3;
    const offsetLng = (Math.random() - 0.5) * 0.3;
    const zoneLat = center.lat + offsetLat;
    const zoneLng = center.lng + offsetLng;

    const size = isHighRisk ? 0.02 : 0.01;

    features.push({
      type: 'Feature',
      properties: {
        FLD_ZONE: zoneType,
        FLOODWAY: isHighRisk ? 'FLOODWAY' : null,
        SFHA_TF: isHighRisk ? 'T' : 'F',
        STATIC_BFE: isHighRisk ? Math.floor(Math.random() * 20) + 10 : null,
        DEPTH: isHighRisk ? Math.floor(Math.random() * 8) + 2 : null,
        VELOCITY: ['AO', 'AH'].includes(zoneType) ? Math.floor(Math.random() * 5) + 1 : null,
        SOURCE_CIT: 'Estimated',
        DFIRM_ID: `${countyFips}C`,
        VERSION_ID: `${countyFips}_${new Date().getFullYear()}_001`,
        risk_level: isHighRisk ? 'HIGH' : 'MODERATE',
        zone_description: getFloodZoneDescription(zoneType)
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [zoneLng - size, zoneLat - size],
          [zoneLng + size, zoneLat - size],
          [zoneLng + size, zoneLat + size],
          [zoneLng - size, zoneLat + size],
          [zoneLng - size, zoneLat - size]
        ]]
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      source: 'FEMA NFHL (estimated)',
      county_fips: countyFips,
      generated_at: new Date().toISOString(),
      total_zones: features.length,
      high_risk_zones: features.filter((f) => ['AE', 'AH', 'AO', 'A'].includes(f.properties.FLD_ZONE)).length,
      is_real_data: false
    }
  };
}

function getFloodZoneDescription(zoneType: string): string {
  const descriptions: Record<string, string> = {
    'AE': 'Special Flood Hazard Area with base flood elevations determined',
    'AH': 'Special Flood Hazard Area with flood depths of 1 to 3 feet',
    'AO': 'Special Flood Hazard Area with sheet flow flood depths of 1 to 3 feet',
    'A': 'Special Flood Hazard Area with no base flood elevations determined',
    'X': 'Areas of minimal flood hazard',
    'X500': 'Areas of 0.2% annual chance flood hazard'
  };
  return descriptions[zoneType] || 'Flood hazard area';
}

// ============================================================================
// PAD-US Protected Areas — REAL fetch with bbox spatial filter
// ============================================================================

async function fetchPADUSProtectedAreasForLocation(city: string, state: string, center: { lat: number; lng: number }) {
  console.log(`Fetching PAD-US protected areas for ${city}, ${state}`);

  const layerName = `PADUS_Protected_Areas_${city.replace(/\s+/g, '_')}_${state}`;

  const { data: existingData, error: checkError } = await supabase
    .from('gis_layers')
    .select('*')
    .eq('layer_name', layerName)
    .eq('layer_type', 'environmental')
    .eq('environmental_type', 'protected_lands')
    .single();

  if (!checkError && existingData) {
    const lastUpdated = new Date(existingData.last_updated);
    const hoursOld = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursOld < 336) {
      console.log(`Using existing PAD-US data (${Math.round(hoursOld)} hours old)`);
      return existingData;
    }
  }

  return await fetchPADUSData(city, state, center);
}

async function fetchPADUSData(city: string, state: string, center: { lat: number; lng: number }) {
  const bbox = {
    xmin: center.lng - 0.15,
    ymin: center.lat - 0.15,
    xmax: center.lng + 0.15,
    ymax: center.lat + 0.15
  };

  let protectedAreasData;
  let isReal = false;

  try {
    const apiUrl = 'https://gis1.usgs.gov/arcgis/rest/services/padus3_0/FeatureServer/0/query';
    const params = new URLSearchParams({
      where: '1=1',
      geometry: `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: '*',
      f: 'geojson',
      returnGeometry: 'true'
    });

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log('PAD-US query URL:', fullUrl);

    const response = await fetch(fullUrl, {
      headers: { 'User-Agent': 'CitadelTwin/1.0' }
    });

    if (!response.ok) {
      console.warn(`USGS API call failed (${response.status}), using fallback`);
      protectedAreasData = generateRealisticPADUSData(center, state);
      console.log('PAD-US: using FALLBACK data');
    } else {
      const realData = await response.json();
      const featureCount = realData?.features?.length || 0;

      if (featureCount === 0) {
        console.warn(`No real PAD-US features near (${center.lat}, ${center.lng})`);
        protectedAreasData = generateRealisticPADUSData(center, state);
        console.log('PAD-US: using FALLBACK data (0 features)');
      } else {
        protectedAreasData = {
          type: 'FeatureCollection',
          features: realData.features.map((feature: any, index: number) => ({
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
              Des_Tp: feature.properties?.Des_Tp || 'Protected Area',
              Agg_Src: feature.properties?.Agg_Src || 'PADUS 3.0',
              GAP_Sts: feature.properties?.GAP_Sts || '2',
              Loc_Own: feature.properties?.Loc_Own || 'Government',
              Unit_Nm: feature.properties?.Unit_Nm || `Protected Area ${index + 1}`,
              Own_Type: feature.properties?.Own_Type || 'Public',
              State_Nm: feature.properties?.State_Nm || state,
              GIS_Acres: feature.properties?.GIS_Acres || 0,
              Mang_Name: feature.properties?.Mang_Name || feature.properties?.Loc_Own || 'Government Agency'
            }
          })),
          metadata: {
            source: 'USGS PAD-US Live',
            total_areas: featureCount,
            is_real_data: true,
            gap_status_1: realData.features.filter((f: any) => f.properties?.GAP_Sts === '1').length,
            gap_status_2: realData.features.filter((f: any) => f.properties?.GAP_Sts === '2').length
          }
        };

        isReal = true;
        console.log('PAD-US: using REAL data, features:', featureCount);
      }
    }
  } catch (error) {
    console.error('Error fetching USGS PAD-US data:', error);
    protectedAreasData = generateRealisticPADUSData(center, state);
    console.log('PAD-US: using FALLBACK data (exception)');
  }

  const layerName = `PADUS_Protected_Areas_${city.replace(/\s+/g, '_')}_${state}`;
  const dataSize = JSON.stringify(protectedAreasData).length;

  const { data, error } = await supabase
    .from('gis_layers')
    .upsert({
      layer_name: layerName,
      layer_type: 'environmental',
      description: `Protected areas for ${city}, ${state}`,
      source_url: 'https://www.usgs.gov/programs/gap-analysis-project/science/protected-areas',
      city,
      state,
      geometry_data: protectedAreasData,
      feature_count: protectedAreasData.features?.length || 0,
      data_size: dataSize,
      status: 'active',
      metadata: {
        source: protectedAreasData.metadata?.source || 'USGS PAD-US',
        accuracy: isReal ? 'official' : 'estimated',
        is_real_data: isReal,
        total_areas: protectedAreasData.features?.length || 0,
        data_provider: 'U.S. Geological Survey',
        gap_status_1: protectedAreasData.metadata?.gap_status_1 || 0,
        gap_status_2: protectedAreasData.metadata?.gap_status_2 || 0
      },
      coordinate_system: 'EPSG:4326',
      processing_status: 'ready',
      environmental_type: 'protected_lands',
      update_frequency: 'static',
      real_time_enabled: true,
      data_freshness_hours: 336
    }, { onConflict: 'layer_name' })
    .select()
    .single();

  if (error) {
    console.error('Error storing PAD-US data:', error);
    return null;
  }

  return data;
}

function generateRealisticPADUSData(center: { lat: number; lng: number }, state: string) {
  const features = [];
  const protectedAreaTypes = [
    { name: 'State Park', gap_status: '1', manager: 'State Parks Department', des_tp: 'State Park' },
    { name: 'National Wildlife Refuge', gap_status: '1', manager: 'U.S. Fish and Wildlife Service', des_tp: 'National Wildlife Refuge' },
    { name: 'State Forest', gap_status: '2', manager: 'State Forestry Department', des_tp: 'State Forest' },
    { name: 'Conservation Area', gap_status: '2', manager: 'County Conservation Board', des_tp: 'Conservation Area' },
    { name: 'Nature Preserve', gap_status: '1', manager: 'Nature Conservancy', des_tp: 'Nature Preserve' },
    { name: 'Wildlife Management Area', gap_status: '2', manager: 'State Wildlife Agency', des_tp: 'Wildlife Management Area' }
  ];

  for (let i = 0; i < 8; i++) {
    const areaType = protectedAreaTypes[i % protectedAreaTypes.length];
    const centerLat = center.lat + (Math.random() - 0.5) * 0.2;
    const centerLng = center.lng + (Math.random() - 0.5) * 0.2;

    const radius = 0.01 + Math.random() * 0.02;
    const coordinates = [];

    for (let angle = 0; angle <= 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const lat = centerLat + radius * Math.cos(rad);
      const lng = centerLng + radius * Math.sin(rad);
      coordinates.push([lng, lat]);
    }

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      properties: {
        Unit_Nm: `${areaType.name} ${i + 1}`,
        Mang_Name: areaType.manager,
        Des_Tp: areaType.des_tp,
        GAP_Sts: areaType.gap_status,
        Own_Type: areaType.gap_status === '1' ? 'Federal' : 'State',
        Loc_Own: areaType.manager,
        State_Nm: state,
        Agg_Src: 'PADUS 3.0 (estimated)',
        GIS_Acres: Math.round(100 + Math.random() * 1000)
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      source: 'USGS PAD-US (estimated)',
      total_areas: features.length,
      is_real_data: false,
      gap_status_1: features.filter((f) => f.properties.GAP_Sts === '1').length,
      gap_status_2: features.filter((f) => f.properties.GAP_Sts === '2').length
    }
  };
}

// ============================================================================
// NRCS Soils — REAL fetch with synthetic fallback
// ============================================================================

async function fetchNRCSSoilsForLocation(city: string, state: string, center: { lat: number; lng: number }) {
  console.log(`Fetching NRCS soils for ${city}, ${state}`);

  const layerName = `NRCS_Soils_${city.replace(/\s+/g, '_')}_${state}`;

  const { data: existingData, error: checkError } = await supabase
    .from('gis_layers')
    .select('*')
    .eq('layer_name', layerName)
    .eq('layer_type', 'environmental')
    .eq('environmental_type', 'soils')
    .single();

  if (!checkError && existingData) {
    const lastUpdated = new Date(existingData.last_updated);
    const hoursOld = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursOld < 720) {
      console.log(`Using existing NRCS soils data (${Math.round(hoursOld)} hours old)`);
      return existingData;
    }
  }

  const bbox = {
    xmin: center.lng - 0.15,
    ymin: center.lat - 0.15,
    xmax: center.lng + 0.15,
    ymax: center.lat + 0.15
  };

  let soilsData;
  let isReal = false;

  try {
    const url =
      'https://sdmdataaccess.sc.egov.usda.gov/Spatial/' +
      'SDMWGS84Geographic.wfs?' +
      'SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature' +
      '&TYPENAME=MapunitPolyExtended' +
      '&BBOX=' + bbox.xmin + ',' + bbox.ymin + ',' +
                 bbox.xmax + ',' + bbox.ymax +
      '&OUTPUTFORMAT=GeoJSON' +
      '&MAXFEATURES=50';

    console.log('NRCS soils query URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CitadelTwin/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('USDA Soils API error:', response.status);
      console.log('FALLBACK DATA (NRCS non-OK response)');
      soilsData = generateRealisticSoilsData(center, state);
    } else {
      const geojson = await response.json();
      const featureCount = geojson?.features?.length || 0;
      console.log('Real soils features received:', featureCount);

      if (featureCount === 0) {
        console.log('FALLBACK DATA (NRCS returned 0 features)');
        soilsData = generateRealisticSoilsData(center, state);
      } else {
        soilsData = {
          type: 'FeatureCollection',
          features: geojson.features,
          metadata: {
            source: 'USDA NRCS SSURGO Live',
            generated_at: new Date().toISOString(),
            total_units: featureCount,
            is_real_data: true
          }
        };
        isReal = true;
        console.log('REAL DATA (NRCS SSURGO)');
      }
    }
  } catch (error) {
    console.error('Soils fetch failed, using fallback:', error);
    console.log('FALLBACK DATA (NRCS exception)');
    soilsData = generateRealisticSoilsData(center, state);
  }

  const dataSize = JSON.stringify(soilsData).length;

  const { data, error } = await supabase
    .from('gis_layers')
    .upsert({
      layer_name: layerName,
      layer_type: 'environmental',
      description: `NRCS soil survey data for ${city}, ${state}`,
      source_url: 'https://websoilsurvey.nrcs.usda.gov/',
      city,
      state,
      geometry_data: soilsData,
      feature_count: soilsData.features?.length || 0,
      data_size: dataSize,
      status: 'active',
      metadata: {
        source: soilsData.metadata?.source || 'USDA NRCS SSURGO',
        accuracy: isReal ? 'official' : 'estimated',
        is_real_data: isReal,
        total_areas: soilsData.features?.length || 0,
        data_provider: 'U.S. Department of Agriculture NRCS',
        last_updated: new Date().toISOString()
      },
      coordinate_system: 'EPSG:4326',
      processing_status: 'ready',
      environmental_type: 'soils',
      update_frequency: 'static',
      real_time_enabled: false,
      data_freshness_hours: 720
    }, { onConflict: 'layer_name' })
    .select()
    .single();

  if (error) {
    console.error('Error storing NRCS soils data:', error);
    return null;
  }

  return data;
}

function generateRealisticSoilsData(center: { lat: number; lng: number }, state: string) {
  const features = [];

  const soilTypes = state === 'FL' ? [
    { name: 'Myakka fine sand', hydgrp: 'A/D', drclass: 'Poorly drained', kfact: 0.10 },
    { name: 'Candler sand', hydgrp: 'A', drclass: 'Excessively drained', kfact: 0.05 },
    { name: 'Pompano fine sand', hydgrp: 'A/D', drclass: 'Very poorly drained', kfact: 0.10 },
    { name: 'Smyrna fine sand', hydgrp: 'A/D', drclass: 'Poorly drained', kfact: 0.10 },
    { name: 'Urban land', hydgrp: 'C', drclass: 'Well drained', kfact: 0.28 }
  ] : state === 'OH' ? [
    { name: 'Mahoning silt loam', hydgrp: 'C', drclass: 'Somewhat poorly drained', kfact: 0.37 },
    { name: 'Ravenna silt loam', hydgrp: 'C/D', drclass: 'Moderately well drained', kfact: 0.37 },
    { name: 'Ellsworth silt loam', hydgrp: 'C', drclass: 'Moderately well drained', kfact: 0.32 },
    { name: 'Fitchville silt loam', hydgrp: 'D', drclass: 'Poorly drained', kfact: 0.37 },
    { name: 'Urban land', hydgrp: 'C', drclass: 'Well drained', kfact: 0.28 }
  ] : [
    { name: 'Loam', hydgrp: 'B', drclass: 'Well drained', kfact: 0.32 },
    { name: 'Silty clay loam', hydgrp: 'C', drclass: 'Moderately well drained', kfact: 0.37 },
    { name: 'Sandy loam', hydgrp: 'A', drclass: 'Well drained', kfact: 0.20 },
    { name: 'Clay', hydgrp: 'D', drclass: 'Poorly drained', kfact: 0.43 },
    { name: 'Urban land', hydgrp: 'C', drclass: 'Well drained', kfact: 0.28 }
  ];

  for (let i = 0; i < 12; i++) {
    const soilType = soilTypes[i % soilTypes.length];
    const centerLat = center.lat + (Math.random() - 0.5) * 0.3;
    const centerLng = center.lng + (Math.random() - 0.5) * 0.3;

    const size = 0.02 + Math.random() * 0.03;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [centerLng - size, centerLat - size],
          [centerLng + size, centerLat - size],
          [centerLng + size, centerLat + size],
          [centerLng - size, centerLat + size],
          [centerLng - size, centerLat - size]
        ]]
      },
      properties: {
        MUKEY: `est_${String(i + 1).padStart(3, '0')}`,
        MUNAME: soilType.name,
        HYDGRP: soilType.hydgrp,
        DRCLASSDCD: soilType.drclass,
        KFACT: soilType.kfact,
        AWS: Math.random() * 0.2 + 0.1,
        TFACT: Math.floor(Math.random() * 3) + 3
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      source: 'USDA NRCS SSURGO (estimated)',
      total_units: features.length,
      is_real_data: false,
      generated_at: new Date().toISOString()
    }
  };
}

// ============================================================================
// USFWS Wetlands — REAL fetch with synthetic fallback
// ============================================================================

async function fetchWetlandsForLocation(city: string, state: string, center: { lat: number; lng: number }) {
  console.log(`Fetching USFWS wetlands for ${city}, ${state}`);

  const layerName = `USFWS_Wetlands_${city.replace(/\s+/g, '_')}_${state}`;

  const { data: existingData, error: checkError } = await supabase
    .from('gis_layers')
    .select('*')
    .eq('layer_name', layerName)
    .eq('layer_type', 'environmental')
    .eq('environmental_type', 'wetlands')
    .single();

  if (!checkError && existingData) {
    const lastUpdated = new Date(existingData.last_updated);
    const hoursOld = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursOld < 336) {
      console.log(`Using existing USFWS wetlands data (${Math.round(hoursOld)} hours old)`);
      return existingData;
    }
  }

  const bbox = {
    xmin: center.lng - 0.15,
    ymin: center.lat - 0.15,
    xmax: center.lng + 0.15,
    ymax: center.lat + 0.15
  };

  let wetlandsData;
  let isReal = false;

  try {
    const url =
      'https://www.fws.gov/wetlands/arcgis/rest/services/' +
      'Wetlands/MapServer/0/query?' +
      'geometry=' + bbox.xmin + ',' + bbox.ymin + ',' +
                    bbox.xmax + ',' + bbox.ymax +
      '&geometryType=esriGeometryEnvelope' +
      '&spatialRel=esriSpatialRelIntersects' +
      '&inSR=4326' +
      '&outSR=4326' +
      '&outFields=ATTRIBUTE,WETLAND_TYPE,ACRES' +
      '&returnGeometry=true' +
      '&f=geojson';

    console.log('USFWS wetlands query URL:', url);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'CitadelTwin/1.0' }
    });

    if (!response.ok) {
      console.warn('USFWS Wetlands API error:', response.status);
      console.log('FALLBACK DATA (USFWS non-OK response)');
      wetlandsData = generateRealisticWetlandsData(center, state);
    } else {
      const geojson = await response.json();
      const featureCount = geojson?.features?.length || 0;
      console.log('Real wetlands features received:', featureCount);

      if (featureCount === 0) {
        console.log('FALLBACK DATA (USFWS returned 0 features)');
        wetlandsData = generateRealisticWetlandsData(center, state);
      } else {
        wetlandsData = {
          type: 'FeatureCollection',
          features: geojson.features,
          metadata: {
            source: 'USFWS NWI Live',
            generated_at: new Date().toISOString(),
            total_wetlands: featureCount,
            is_real_data: true
          }
        };
        isReal = true;
        console.log('REAL DATA (USFWS NWI)');
      }
    }
  } catch (error) {
    console.error('Wetlands fetch failed, using fallback:', error);
    console.log('FALLBACK DATA (USFWS exception)');
    wetlandsData = generateRealisticWetlandsData(center, state);
  }

  const dataSize = JSON.stringify(wetlandsData).length;

  const { data, error } = await supabase
    .from('gis_layers')
    .upsert({
      layer_name: layerName,
      layer_type: 'environmental',
      description: `USFWS National Wetlands Inventory data for ${city}, ${state}`,
      source_url: 'https://www.fws.gov/wetlands/',
      city,
      state,
      geometry_data: wetlandsData,
      feature_count: wetlandsData.features?.length || 0,
      data_size: dataSize,
      status: 'active',
      metadata: {
        source: wetlandsData.metadata?.source || 'USFWS NWI',
        accuracy: isReal ? 'official' : 'estimated',
        is_real_data: isReal,
        total_areas: wetlandsData.features?.length || 0,
        data_provider: 'U.S. Fish and Wildlife Service',
        last_updated: new Date().toISOString()
      },
      coordinate_system: 'EPSG:4326',
      processing_status: 'ready',
      environmental_type: 'wetlands',
      update_frequency: 'static',
      real_time_enabled: false,
      data_freshness_hours: 336
    }, { onConflict: 'layer_name' })
    .select()
    .single();

  if (error) {
    console.error('Error storing USFWS wetlands data:', error);
    return null;
  }

  return data;
}

function generateRealisticWetlandsData(center: { lat: number; lng: number }, state: string) {
  const features = [];

  const wetlandTypes = state === 'FL' ? [
    { type: 'PFO1A', system: 'Palustrine', class: 'Forested', water_regime: 'Temporarily flooded' },
    { type: 'PSS1C', system: 'Palustrine', class: 'Scrub-shrub', water_regime: 'Seasonally flooded' },
    { type: 'PEM1C', system: 'Palustrine', class: 'Emergent', water_regime: 'Seasonally flooded' },
    { type: 'L1UBH', system: 'Lacustrine', class: 'Unconsolidated bottom', water_regime: 'Permanently flooded' },
    { type: 'R2UBH', system: 'Riverine', class: 'Unconsolidated bottom', water_regime: 'Permanently flooded' }
  ] : [
    { type: 'PEM1C', system: 'Palustrine', class: 'Emergent', water_regime: 'Seasonally flooded' },
    { type: 'PFO1A', system: 'Palustrine', class: 'Forested', water_regime: 'Temporarily flooded' },
    { type: 'PSS1C', system: 'Palustrine', class: 'Scrub-shrub', water_regime: 'Seasonally flooded' },
    { type: 'L1UBH', system: 'Lacustrine', class: 'Unconsolidated bottom', water_regime: 'Permanently flooded' },
    { type: 'R4SBC', system: 'Riverine', class: 'Streambed', water_regime: 'Seasonally flooded' }
  ];

  for (let i = 0; i < 8; i++) {
    const wetlandType = wetlandTypes[i % wetlandTypes.length];
    const centerLat = center.lat + (Math.random() - 0.5) * 0.3;
    const centerLng = center.lng + (Math.random() - 0.5) * 0.3;

    const size = 0.005 + Math.random() * 0.015;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [centerLng - size, centerLat - size],
          [centerLng + size, centerLat - size],
          [centerLng + size, centerLat + size],
          [centerLng - size, centerLat + size],
          [centerLng - size, centerLat - size]
        ]]
      },
      properties: {
        WETLAND_TY: wetlandType.type,
        SYSTEM: wetlandType.system,
        CLASS: wetlandType.class,
        WATER_REGI: wetlandType.water_regime,
        ACRES: Math.round((size * size * 111000 * 111000 * 0.000247105) * 100) / 100,
        ATTRIBUTE: 'Estimated'
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      source: 'USFWS NWI (estimated)',
      total_wetlands: features.length,
      is_real_data: false,
      generated_at: new Date().toISOString()
    }
  };
}

// ============================================================================
// OpenFEMA Disaster Declaration History
// ============================================================================

async function handleDisasterHistoryFetch(request: GISRequest) {
  const { state, latitude, longitude } = request;

  if (!state) {
    return new Response(
      JSON.stringify({ success: true, disasters: [], source: 'OpenFEMA', note: 'state required' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let countyName: string | null = null;
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    try {
      const { name } = await getCountyFipsForLocation(latitude, longitude);
      // Census returns names like "Orange County" — strip " County" suffix for OpenFEMA matching
      countyName = name.replace(/\s+County\s*$/i, '').trim();
    } catch (err) {
      console.error('Census county lookup failed in disaster handler:', err);
    }
  }

  const disasters = await fetchOpenFEMADisasters(state, countyName);

  return new Response(
    JSON.stringify({
      success: true,
      disasters,
      county: countyName,
      state,
      source: 'OpenFEMA',
      fetched_at: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function fetchOpenFEMADisasters(stateCode: string, countyName: string | null) {
  const base = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';

  if (countyName) {
    const designated = `${countyName} (County)`;
    const filter = `state eq '${stateCode}' and designatedArea eq '${designated.replace(/'/g, "''")}'`;
    const url = `${base}?$filter=${encodeURIComponent(filter)}&$orderby=declarationDate desc&$top=10&$format=json`;

    try {
      console.log('OpenFEMA county-scoped query:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data?.DisasterDeclarationsSummaries)
          ? data.DisasterDeclarationsSummaries
          : [];
        if (records.length > 0) {
          console.log(`OpenFEMA returned ${records.length} county-scoped disasters`);
          return records.map(normalizeDisasterRecord);
        }
      } else {
        console.warn('OpenFEMA county query non-OK:', response.status);
      }
    } catch (error) {
      console.error('OpenFEMA county-scoped fetch failed:', error);
    }
  }

  try {
    const stateFilter = `state eq '${stateCode}'`;
    const stateUrl = `${base}?$filter=${encodeURIComponent(stateFilter)}&$orderby=declarationDate desc&$top=10&$format=json`;
    console.log('OpenFEMA state-only query:', stateUrl);
    const response = await fetch(stateUrl);
    if (!response.ok) {
      console.warn('OpenFEMA state query non-OK:', response.status);
      return [];
    }
    const data = await response.json();
    const records = Array.isArray(data?.DisasterDeclarationsSummaries)
      ? data.DisasterDeclarationsSummaries
      : [];
    console.log(`OpenFEMA returned ${records.length} state-scoped disasters`);
    return records.map(normalizeDisasterRecord);
  } catch (error) {
    console.error('OpenFEMA state-only fetch failed:', error);
    return [];
  }
}

function normalizeDisasterRecord(r: any) {
  return {
    disasterNumber: r?.disasterNumber ?? null,
    declarationDate: r?.declarationDate ?? null,
    incidentType: r?.incidentType ?? 'Unknown',
    declarationTitle: r?.declarationTitle ?? '',
    designatedArea: r?.designatedArea ?? '',
    incidentBeginDate: r?.incidentBeginDate ?? null,
    incidentEndDate: r?.incidentEndDate ?? null
  };
}
